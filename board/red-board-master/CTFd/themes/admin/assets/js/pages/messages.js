import "./main";
import "core/utils";
import $ from "jquery";
import CTFd from "core/CTFd";
import { ezAlert } from "core/ezq";
import Vue from "vue/dist/vue.esm.browser";
import Messages from "../components/notifications/Messages.vue";

const messageCard = Vue.extend(Messages);

function submit(event) {
  event.preventDefault();
  const $form = $(this);
  const params = $form.serializeJSON();

  // Disable button after click
  $form.find("button[type=submit]").attr("disabled", true);

  CTFd.api.post_message_list({}, params).then(response => {
    $form.find(":input[name=body]").val("");

    setTimeout(function() {
      $form.find("button[type=submit]").attr("disabled", false);
    }, 1000);
    if (!response.success) {
      ezAlert({
        title: "Error",
        body: "Could not send message. Please try again.",
        button: "OK"
      });
    }

    let vueContainer = document.createElement("div");
    $("#messages-list").prepend(vueContainer);
    new messageCard({
      propsData: {
        id: response.data.id,
        body: response.data.body,
      }
    }).$mount(vueContainer);
  });
}

function deleteMessage(event) {
  event.preventDefault();
  const $elem = $(this);
  const id = $elem.data("mess-id");

  if (confirm("Are you sure you want to delete this message?")) {
    CTFd.api.delete_message({ messageId: id }).then(response => {
      if (response.success) {
        $elem.parent().remove();
      }
    });
  }
}

$(() => {
  $("#messages_form").submit(submit);
  $(".delete-message").click(deleteMessage);
});
