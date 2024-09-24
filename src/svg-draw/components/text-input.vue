<template>
  <div class="text-input" :style="wrapStyle" @click.stop>
    <a-input v-model="inputValue"></a-input>
  </div>
</template>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { textInputConfig } from "../config";

const props = defineProps({
  defaultValue: {
    type: String,
    default: "",
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  color: {
    type: String,
    default: "",
  },
});

const wrapStyle: StyleValue = {
  width: textInputConfig.width + "px",
  height: textInputConfig.height + "px",
};

const inputValue = ref(props.defaultValue);
</script>

<style scoped lang="less">
.text-input {
  display: inline-block;
  box-sizing: border-box;
}
</style>
