import React, { useCallback, useMemo, useState } from "react";
import { jsx } from "slate-hyperscript";
import isHotkey from "is-hotkey";
import isUrl from "is-url";
import {
  Slate,
  Editable,
  withReact,
  useSlate,
  useEditor,
  useSelected,
  useFocused,
} from "slate-react";
import {
  Transforms,
  Editor,
  Range,
  Node,
  Element as SlateElement,
  createEditor,
} from "slate";
import { withHistory } from "slate-history";
import { isArray, isElement, has } from "lodash";
import { makeStyles } from "@material-ui/core/styles";
import imageExtensions from "image-extensions";
import { css } from "emotion";
import _ from "lodash";

import { Button, Icon, Toolbar } from "./PostEditorComponents";

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];

const EMPTY_PARAGRAPH = [{ type: "paragraph", children: [{ text: "" }] }];

const DEFAULT_VALUE = EMPTY_PARAGRAPH;

function isEmptyContent(v) {
  return !isArray(v) || (isArray(v) && v.length == 0);
}

const ELEMENT_TAGS = {
  A: (el) => ({ type: "link", url: el.getAttribute("href") }),
  BLOCKQUOTE: () => ({ type: "quote" }),
  H1: () => ({ type: "heading-one" }),
  H2: () => ({ type: "heading-two" }),
  IMG: (el) => ({ type: "image", url: el.getAttribute("src") }),
  LI: () => ({ type: "list-item" }),
  OL: () => ({ type: "numbered-list" }),
  P: () => ({ type: "paragraph" }),
  PRE: () => ({ type: "code" }),
  UL: () => ({ type: "bulleted-list" }),
};

// COMPAT: `B` is omitted here because Google Docs uses `<b>` in weird ways.
const TEXT_TAGS = {
  CODE: () => ({ code: true }),
  DEL: () => ({ strikethrough: true }),
  EM: () => ({ italic: true }),
  I: () => ({ italic: true }),
  S: () => ({ strikethrough: true }),
  STRONG: () => ({ bold: true }),
  U: () => ({ underline: true }),
};

export const deserialize = (el) => {
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  } else if (el.nodeName === "BR") {
    return "\n";
  }

  const { nodeName } = el;
  let parent = el;

  if (
    nodeName === "PRE" &&
    el.childNodes[0] &&
    el.childNodes[0].nodeName === "CODE"
  ) {
    parent = el.childNodes[0];
  }
  const children = Array.from(parent.childNodes).map(deserialize).flat();

  if (el.nodeName === "BODY") {
    return jsx("fragment", {}, children);
  }

  if (ELEMENT_TAGS[nodeName]) {
    const attrs = ELEMENT_TAGS[nodeName](el);
    return jsx("element", attrs, children);
  }

  if (TEXT_TAGS[nodeName]) {
    const attrs = TEXT_TAGS[nodeName](el);
    return children.map((child) => jsx("text", attrs, child));
  }

  return children;
};

const withHtml = (editor) => {
  const { insertData, isInline, isVoid } = editor;

  editor.isInline = (element) => {
    return element.type === "link" ? true : isInline(element);
  };

  editor.isVoid = (element) => {
    return element.type === "image" ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    const html = data.getData("text/html");

    if (html) {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const fragment = deserialize(parsed.body);
      Transforms.insertFragment(editor, fragment);
      return;
    }

    insertData(data);
  };

  return editor;
};

const withLinks = (editor) => {
  const { insertData, insertText, isInline } = editor;

  editor.isInline = (element) => {
    return element.type === "link" ? true : isInline(element);
  };

  editor.insertText = (text) => {
    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertText(text);
    }
  };

  editor.insertData = (data) => {
    const text = data.getData("text/plain");

    if (text && isUrl(text)) {
      wrapLink(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

const insertLink = (editor, url) => {
  if (editor.selection) {
    wrapLink(editor, url);
  }
};

const isLinkActive = (editor) => {
  const [link] = Editor.nodes(editor, { match: (n) => n.type === "link" });
  return !!link;
};

const unwrapLink = (editor) => {
  Transforms.unwrapNodes(editor, { match: (n) => n.type === "link" });
};

const wrapLink = (editor, url) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);
  const link = {
    type: "link",
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: "end" });
  }
};

const LinkButton = () => {
  const editor = useSlate();
  return (
    <Button
      active={isLinkActive(editor)}
      onMouseDown={(event) => {
        event.preventDefault();
        const url = window.prompt("Enter the URL of the link:");
        if (!url) return;
        insertLink(editor, url);
      }}
    >
      <Icon>link</Icon>
    </Button>
  );
};

// TODO
// optimize this.
const LimitTextByCount = (value, maxCount = Infinity) => {
  if (maxCount == Infinity) {
    return value;
  }
  var count = 0;
  const node = { children: _.cloneDeep(value) };
  var found = null;
  for (const [n, p] of Node.texts(node)) {
    count += n.text.length;
    if (count >= maxCount) {
      found = [n, p];
      break;
    }
  }
  if (found) {
    const [n, p] = found;
    const limitedNode = {
      ...n,
      text: n.text.substr(0, maxCount - (count - n.text.length)),
    };
    var nParent;
    var i;
    for (i = 0; i < p.length - 1; i++) {
      nParent = node.children[p[i]];
    }
    nParent.children[p[p.length - 1]] = limitedNode;
    nParent.children.push({ type: "__load-more", children: [{ text: "" }] });
    node.children = node.children.slice(0, p[0] + 1);
  }
  return node.children;
};

const PostEditor = ({
  readOnly = false,
  initData = DEFAULT_VALUE,
  data,
  onChange,
  initMaxTextCountDisplay = Infinity,
  editableProps = {},
}) => {
  const classes = useStyles();
  const [value, setValue] = useState(initData);
  const [maxTextCountDisplay, setMaxTextCountDisplay] = useState(
    initMaxTextCountDisplay
  );
  const loadMoreProps = {
    onClick: () => {
      setMaxTextCountDisplay(Infinity);
    },
  };
  const renderElement = useCallback(
    (props) => <Element loadMoreProps={loadMoreProps} {...props} />,
    []
  );
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(
    () =>
      withHtml(withLayout(withImages(withHistory(withReact(createEditor()))))),
    []
  );
  const handleChange = (nextValue) => {
    if (!data) {
      setValue(nextValue);
    }
    if (onChange) {
      onChange(nextValue);
    }
  };
  const v = data || value;
  const finalValue = readOnly ? LimitTextByCount(v, maxTextCountDisplay) : v;
  return (
    <Slate
      editor={editor}
      value={isEmptyContent(finalValue) ? DEFAULT_VALUE : finalValue}
      onChange={handleChange}
    >
      {readOnly == false ? (
        <Toolbar>
          <MarkButton format="bold" icon="format_bold" />
          <MarkButton format="italic" icon="format_italic" />
          <MarkButton format="underline" icon="format_underlined" />
          <MarkButton format="code" icon="code" />
          <BlockButton format="heading-one" icon="looks_one" />
          <BlockButton format="heading-two" icon="looks_two" />
          <BlockButton format="numbered-list" icon="format_list_numbered" />
          <BlockButton format="bulleted-list" icon="format_list_bulleted" />
          <LinkButton />
          <InsertImageButton />
        </Toolbar>
      ) : null}
      <Editable
        className={classes.editable}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        spellCheck={false}
        readOnly={readOnly}
        onKeyDown={(event) => {
          for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
              event.preventDefault();
              // const mark = HOTKEYS[hotkey];
              // toggleMark(editor, mark);
            }
          }
        }}
        {...editableProps}
      />
    </Slate>
  );
};

const useStyles = makeStyles({
  editable: {},
});

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => LIST_TYPES.includes(n.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n.type === format,
  });

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Element = (props) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    case "link":
      return (
        <a {...attributes} href={element.url}>
          {children}
        </a>
      );
    case "image":
      return <ImageElement {...props} />;
    case "__load-more":
      return (
        <span
          className={css`
            cursor: pointer;
            color: blue;
            &:hover {
              text-decoration: underline;
            }
          `}
          {...props.loadMoreProps}
          {...attributes}
        >
          ... 展開全文
        </span>
      );
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const BlockButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

const MarkButton = ({ format, icon }) => {
  const editor = useSlate();
  return (
    <Button
      active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon>{icon}</Icon>
    </Button>
  );
};

const withLayout = (editor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = ([node, path]) => {
    if (node.type == "image") {
      var nextChildPath = path.slice();
      nextChildPath[path.length - 1] += 1;
      const hasNext = Node.has(editor, nextChildPath);
      if (hasNext == false) {
        const emptyParagraph = [
          { type: "paragraph", children: [{ text: "" }] },
        ];
        Transforms.insertNodes(editor, emptyParagraph, { at: nextChildPath });
      }
    }
    return normalizeNode([node, path]);
  };

  return editor;
};

const insertImage = (editor, url) => {
  const text = { text: "" };
  const image = { type: "image", url, children: [text] };
  Transforms.insertNodes(editor, image);
};

const ImageElement = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          src={element.url}
          className={css`
            display: block;
            max-width: 100%;
            max-height: 20em;
            box-shadow: ${selected && focused ? "0 0 0 3px #B4D5FF" : "none"};
          `}
        />
      </div>
      {children}
    </div>
  );
};

const withImages = (editor) => {
  const { insertData, isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === "image" ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    const text = data.getData("text/plain");
    const { files } = data;
    if (isImageUrl(text)) {
      insertImage(editor, text);
    } else {
      insertData(data);
    }
  };

  return editor;
};

const InsertImageButton = () => {
  const editor = useEditor();
  return (
    <Button
      onMouseDown={(event) => {
        event.preventDefault();
        const url = window.prompt("Enter the URL of the image:");
        if (!url) return;
        insertImage(editor, url);
      }}
    >
      <Icon>image</Icon>
    </Button>
  );
};

const isImageUrl = (url) => {
  if (!url) return false;
  if (!isUrl(url)) return false;
  const ext = new URL(url).pathname.split(".").pop();
  return imageExtensions.includes(ext);
};

const initialValue = [
  {
    type: "paragraph",
    children: [
      { text: "This is editable " },
      { text: "rich", bold: true },
      { text: " text, " },
      { text: "much", italic: true },
      { text: " better than a " },
      { text: "<textarea>", code: true },
      { text: "!" },
    ],
  },
  {
    type: "paragraph",
    children: [
      {
        text:
          "Since it's rich text, you can do things like turn a selection of text ",
      },
      { text: "bold", bold: true },
      {
        text:
          ", or add a semantically rendered block quote in the middle of the page, like this:",
      },
    ],
  },
  {
    type: "block-quote",
    children: [{ text: "A wise quote." }],
  },
  {
    type: "paragraph",
    children: [{ text: "Try it out for yourself!" }],
  },
];

export default PostEditor;
