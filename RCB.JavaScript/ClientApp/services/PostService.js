import { ServiceBase } from "@Core/ServiceBase";

export default class PostService extends ServiceBase {
  async search(term = null) {
    if (term == null) {
      term = "";
    }
    var result = await this.requestJson({
      url: `/api/Person/Search?term=${term}`,
      method: "GET",
    });
    return result;
  }

  async getById(id) {
    var result = await this.requestJson({
      url: `/api/posts/${id}`,
      method: "GET",
    });
    return result;
  }

  async getByPage(page = 1) {
    var result = await this.requestJson({
      url: `/api/posts?page=${page}`,
      method: "GET",
    });
    return result;
  }

  async update(model) {
    var result = await this.requestJson({
      url: `/api/Person/${model.id}`,
      method: "PATCH",
      data: model,
    });
    return result;
  }

  async delete(form) {
    const { postId } = form;
    console.log('form', form)
    var result = await this.requestJson({
      url: `/api/posts/${postId}`,
      method: "DELETE",
      data: { accessToken: form.accessToken },
    });
    return result;
  }

  async add(model) {
    var result = await this.requestJson({
      url: "/api/posts",
      method: "POST",
      data: model,
    });
    return result;
  }
}
