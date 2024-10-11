<template>
  <div
    ref="mentionModalRef"
    :class="['mention-modal', mentionModalWrapClassName]"
    :style="{ top: top, left: left }"
  >
    <a-input
      class="mention-input"
      v-model:value="searchVal"
      ref="inputRef"
      @keyup="inputKeyupHandler"
    />
    <ul class="mention-list">
      <li
        v-for="item in searchedList"
        :key="item.id"
        @click="insertMentionHandler(item.id, item.name)"
      >
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { mentionModalWrapClassName } from "./config.ts";
import { lineHeight } from "../../config";

const emit = defineEmits(["insertMention", "hideMentionModal"]);
const list = [
  { id: "a", name: "A张三" },
  { id: "b", name: "B李四" },
  { id: "c", name: "C小明" },
  { id: "d", name: "D小李" },
  { id: "e", name: "E小红" },
];

const top = ref("");
const left = ref("");
const searchVal = ref("");

const searchedList = computed(() => {
  const val = searchVal.value.trim().toLowerCase();
  return list.filter((item) => {
    const name = item.name.toLowerCase();
    if (name.indexOf(val) >= 0) {
      return true;
    }
    return false;
  });
});

const inputKeyupHandler = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    // 插入第一个
    const firstOne = searchedList.value[0];
    if (firstOne) {
      const { id, name } = firstOne;
      insertMentionHandler(id, name);
    }
  }
};

function insertMentionHandler(id: string, name: string) {
  emit("insertMention", id, name);
  emit("hideMentionModal"); // 隐藏 modal
}

const mentionModalRef = shallowRef();
async function calcModalPosition() {
  // 获取光标位置
  const domSelection = document.getSelection();
  const domRange = domSelection?.getRangeAt(0);
  if (domRange == null) return;
  const rect = domRange.getBoundingClientRect();
  await nextTick();
  // 定位 modal
  if (rect.left + mentionModalRef.value.offsetWidth > window.innerWidth) {
    // 超出浏览器右侧显示区域
    left.value = `${rect.left - mentionModalRef.value.offsetWidth - 5}px`;
  } else {
    left.value = `${rect.left}px`;
  }

  if (
    rect.top + mentionModalRef.value.offsetHeight + lineHeight >
    window.innerHeight
  ) {
    // 超出浏览器下侧显示区域
    top.value = `${rect.top - mentionModalRef.value.offsetHeight}px`;
  } else {
    top.value = `${rect.top + lineHeight}px`;
  }
}

const inputRef = shallowRef();
onMounted(() => {
  calcModalPosition();

  // focus input
  inputRef.value.focus();
});
</script>

<style scoped>
.mention-modal {
  position: fixed;
  background-color: #fff;
  padding: 5px;
  border-radius: 3px;
  width: 120px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05),
    0px 6px 16px 0px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
}

.mention-modal ul {
  padding: 0;
  margin: 0;
}

.mention-modal ul li {
  list-style: none;
  cursor: pointer;
  padding: 3px 0;
  text-align: left;
}

.mention-modal ul li:hover {
  text-decoration: underline;
}
</style>
