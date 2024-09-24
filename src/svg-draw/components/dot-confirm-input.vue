<template>
  <div
    ref="containerRef"
    class="dot-confirm-input"
    :style="wrapStyle"
    @click.stop
  >
    <template v-if="contentDisabled">
      <a-tooltip>
        <template #title>
          <div>展示</div>
          <div>展示</div>
          <div>展示</div>
          <div>展示</div>
          <div>展示</div>
          <div>展示</div>
          <div>展示</div>
        </template>
      </a-tooltip>
    </template>

    <template v-else>
      <div class="input-wrap">
        <a-textarea
          v-model:value="inputValue"
          class="w-100%"
          :auto-size="{
            minRows: 2,
            maxRows: 3,
          }"
          show-count
          :maxlength="50"
          placeholder="请输入"
        >
        </a-textarea>
        <div class="btn-wrap">
          <span class="cancel" @click="handleCancel">取消</span>
          <span class="confirm" @click="handleConfirm">确认</span>
        </div>
      </div>

      <div class="cycle-wrap">
        <span class="cycle"></span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { useElementSize } from "@vueuse/core";
import dayjs from "dayjs";
import { dotConfirmInputConfig } from "../config";

const props = defineProps({
  defaultValue: {
    type: String,
    default: "",
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  element: {
    type: Object,
    default: () => {},
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const contentDisabled = ref(props.disabled);
const wrapStyle: StyleValue = {
  width: dotConfirmInputConfig.width + "px",
  minHeight: dotConfirmInputConfig.height + "px",
};

const inputValue = ref(props.defaultValue);

const containerRef = shallowRef();
const { width, height } = useElementSize(containerRef);
watch([width, height], ([val1, val2]) => {
  if (props.element) {
    props.element.size(val1, val2);
    // 平移
    props.element.transform({
      translateX: Number(`-${val1 / 2}`),
      translateY: Number(`-${val2}`),
    });
  }
});

function handleCancel() {
  props.element.fire("cancel");
}
const headImage = "https://img1.baidu.com/it/u=2988791768,3486679626&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200"
function handleConfirm() {
  contentDisabled.value = true;

  props.element.fire("confirm", {
    width: dotConfirmInputConfig.avatarWidth,
    height: dotConfirmInputConfig.avatarHeight,
    data: {
      headImage,
      nikeName: '',
      text: inputValue.value,
      createTime: dayjs().format("YYYY-MM-DD HH:mm"),
    },
  });
}
</script>

<style scoped lang="less">
.dot-confirm-input {
  display: flex;
  box-sizing: border-box;
  z-index: 3;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
}

.input-wrap {
  background-color: #fff;
  border-radius: 4px;
  max-width: 100%;
  padding: 5px;

  .btn-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 2px;

    .cancel {
      margin-right: 10px;
      cursor: pointer;
    }

    .confirm {
      color: @primary-color;
      cursor: pointer;
    }
  }
}

.cycle-wrap {
  display: flex;
  justify-content: center;
  margin-top: 10px;

  .cycle {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 5px solid @primary-color;
    border-radius: 50%;
  }
}
</style>
