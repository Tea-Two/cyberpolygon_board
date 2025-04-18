<template>
  <div class="card bg-light mb-4">
    <button
      type="button"
      :data-notif-id="this.id"
      class="delete-message close position-absolute p-3"
      style="right:0;"
      data-dismiss="alert"
      aria-label="Close"
      @click="deleteMessage()"
    >
      <span aria-hidden="true">&times;</span>
    </button>
    <div class="card-body">
      <blockquote class="blockquote mb-0">
        <p v-html="this.body"></p>
      </blockquote>
    </div>
  </div>
</template>

<script>
import CTFd from "core/CTFd";
import hljs from "highlight.js";
export default {
  props: {
    id: Number,
    body: String,
  },
  methods: {
    deleteMessage: function() {
      if (confirm("Are you sure you want to delete this message?")) {
        CTFd.api
          .delete_message({ messageId: this.id })
          .then(response => {
            if (response.success) {
              // Delete the current component
              // https://stackoverflow.com/a/55384005
              this.$destroy();
              this.$el.parentNode.removeChild(this.$el);
            }
          });
      }
    }
  },
  mounted() {
    this.$el.querySelectorAll("pre code").forEach(block => {
      hljs.highlightBlock(block);
    });
  }
};
</script>
