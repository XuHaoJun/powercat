import { createSlice } from "@reduxjs/toolkit";
import PostService from "@Services/PostService";
import { isArray, chain, identity, head, tail } from "lodash";

// Workaround
// should drop rootElement from server-side.
function tidyPost(post = {}) {
  if (post.content && post.content.rootElement) {
    post.content = post.content.rootElement;
  }
}

function tidyPosts(_posts = []) {
  const posts = _posts || [];
  var i;
  for (i = 0; i < posts.length; i++) {
    const p = posts[i];
    tidyPost(p);
    if (p.children) {
      tidyPosts(p.children);
    }
  }
}

// Breadth first
function findPost(_posts = [], predicate = identity) {
  var next = _posts;
  var children = [];
  var i;
  for (i = 0; i < next.length; i++) {
    const p = next[i];
    if (predicate(p)) {
      return p;
    } else {
      if (isArray(p.children)) {
        children = [...p.children, ...children];
      }
    }
  }
  if (children.length > 0) {
    return findPost(children, predicate);
  } else {
    return null;
  }
}

// Create the slice.
const slice = createSlice({
  name: "post",
  initialState: {
    isFetching: false,
    collection: [],
  },
  reducers: {
    setFetching: (state, action) => {
      state.isFetching = action.payload;
    },
    setData: (state, action) => {
      state.collection = action.payload;
    },
    addData: (state, action) => {
      // TODO
      // should check each posts isRoot.
      const isRoot =
        isArray(action.payload) ||
        (action.payload && !action.payload.parentPostId);
      if (isRoot) {
        const xs = isArray(action.payload) ? action.payload : [action.payload];
        state.collection = [...xs, ...state.collection];
        state.collection = chain(state.collection)
          .groupBy("postId")
          .map((sameIdGroup) => {
            return chain(sameIdGroup)
              .maxBy((p) => new Date(p.updatedAt).getTime())
              .value();
          })
          .flatten()
          .sortBy((p) => -1 * new Date(p.createdAt).getTime())
          .value();
      } else {
        const x = action.payload;
        if (x.parentPostId > 0) {
          const parentPost = findPost([...state.collection], (p) => {
            return p.postId == x.parentPostId;
          });
          if (parentPost) {
            const _children = parentPost.children || [];
            const nextChildren = [..._children, x];
            parentPost.children = nextChildren;
            state.collection = [...state.collection];
          }
        }
      }
    },
    updateData: (state, action) => {
      // We need to clone collection (Redux-way).
      var collection = [...state.collection];
      var entry = collection.find((x) => x.id === action.payload.id);
      entry.firstName = action.payload.firstName;
      entry.lastName = action.payload.lastName;
      state.collection = [...state.collection];
    },
    deleteData: (state, action) => {
      state.collection = state.collection.filter(
        (x) => x.id !== action.payload.id
      );
    },
  },
});

// Export reducer from the slice.
export const { reducer } = slice;

// Define action creators.
export const actionCreators = {
  search: (term = null) => async (dispatch) => {
    dispatch(slice.actions.setFetching(true));

    const service = new PostService();

    const result = await service.search(term);

    if (!result.hasErrors) {
      dispatch(slice.actions.setData(result.value));
    }

    dispatch(slice.actions.setFetching(false));

    return result;
  },
  getByPage: (page = 1) => async (dispatch) => {
    dispatch(slice.actions.setFetching(true));

    const service = new PostService();

    const result = await service.getByPage(page);

    if (!result.hasErrors) {
      dispatch(slice.actions.addData(result.value));
    }

    dispatch(slice.actions.setFetching(false));

    return result;
  },
  add: (model) => async (dispatch) => {
    dispatch(slice.actions.setFetching(true));

    const service = new PostService();

    const result = await service.add(model);

    if (!result.hasErrors) {
      // model.id = result.value;
      dispatch(slice.actions.addData(result.value));
    }

    dispatch(slice.actions.setFetching(false));

    return result;
  },
  update: (model) => async (dispatch) => {
    dispatch(slice.actions.setFetching(true));

    const service = new PostService();

    const result = await service.update(model);

    if (!result.hasErrors) {
      dispatch(slice.actions.updateData(model));
    }

    dispatch(slice.actions.setFetching(false));

    return result;
  },
  delete: (id) => async (dispatch) => {
    dispatch(slice.actions.setFetching(true));

    const service = new PostService();

    const result = await service.delete(id);

    if (!result.hasErrors) {
      dispatch(slice.actions.deleteData({ id }));
    }

    dispatch(slice.actions.setFetching(false));

    return result;
  },
};
