<template>
  <Editor
    class="rich-editor-wrap"
    v-model="html"
    :defaultConfig="editorConfig"
    @onChange="onChange"
    @onCreated="onCreated"
  />
  <!-- @弹出框渲染到body -->
  <Teleport v-if="isShowModal" to="body">
    <mention-modal
      @hideMentionModal="hideMentionModal"
      @insertMention="insertMention"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { Boot } from "@wangeditor/editor";
// @ts-ignore
import { Editor } from "@wangeditor/editor-for-vue";
import "@wangeditor/editor/dist/css/style.css";
import mentionModule from "./modules/mention/index";
import MentionModal from "./modules/mention/mention-modal.vue";
import { lineHeight } from './config';
import { uniqBy } from 'lodash-es';

// 注册插件
Boot.registerModule(mentionModule);

const props = defineProps({
  modelValue: {
    type: String,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: "请输入内容...",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  customStyles: {
    type: Object,
    default: () => {},
  }
});

const emit = defineEmits(["update:modelValue"]);

const html = ref(props.modelValue);
watch(
  () => props.modelValue,
  (val) => {
    html.value = val;
  }
);
watch(html, (val: any) => {
  emit("update:modelValue", val);
});

const editorConfig = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  // 【注意】这里一定要加 EXTEND_CONF，否则无法使用 mention 插件
  EXTEND_CONF: {
    mentionConfig: {
      showModal: showMentionModal,
      hideModal: hideMentionModal,
    },
  },
};

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef();
function onCreated(editor: any) {
  editorRef.value = editor;
}

watch(
  () => props.disabled,
  (val: any) => {
    if (val) {
      editorRef.value?.disable();
    } else {
      editorRef.value?.enable();
    }
  }
);

function onChange() {}

const isShowModal = ref(false);
function showMentionModal() {
  isShowModal.value = true;
}
function hideMentionModal() {
  isShowModal.value = false;
}

function insertMention(id: string, name: string) {
  const mentionNode = {
    type: "mention", // 必须是 'mention'
    value: name,
    info: { id },
    children: [{ text: "" }], // 必须有一个空 text 作为 children
  };

  if (editorRef.value) {
    editorRef.value.restoreSelection(); // 恢复选区
    editorRef.value.deleteBackward("character"); // 删除 '@'
    editorRef.value.insertNode(mentionNode); // 插入 mention
    editorRef.value.move(1); // 移动光标
  }
}

onBeforeUnmount(() => {
  if (editorRef.value == null) return;
  editorRef.value.destroy();
});

function getEditorData() {
  const mentions = editorRef.value.getElemsByType('mention').map((i: any) => ({
    value: i.info.id,
    label: i.value,
  }))
  const text = editorRef.value.getText()

  return {
    text,
    mentions: uniqBy(mentions, 'value')
  }
}

defineExpose({
  getEditorData
})
</script>

<style scoped lang="less">

.rich-editor-wrap {
  padding: 3px 0;
  height: inherit !important;
}
:deep(.w-e-text-container p) {
  margin: 0;
  font-size: 14px;
  line-height: v-bind("lineHeight + 'px'");
}

:deep(.w-e-text-container [data-slate-editor]) {
  border-top: none;
}

:deep(.w-e-text-placeholder) {
  top: 0px;
}

:deep(.w-e-text-container .w-e-scroll) {
  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #bfbfbf;
    border-radius: 5px;
    border: 1px solid #f1f1f1;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #a8a8a8;
  }

  &::-webkit-scrollbar-thumb:active {
    background-color: #787878;
  }
}
</style>
