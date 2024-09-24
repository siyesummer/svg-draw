<template>
  <div
    ref="containerRef"
    class="area-confirm-input"
    @click.stop
    @mousedown.stop
  >
    <template v-if="contentDisabled">
      <AnnotationsTooltip :nodeData="nodeData" :max-rows="6">
        <div class="avatar-wrap" :style="avatarWrapStyle">
          <a-avatar
            :size="confirmInputConfig.avatarSize"
            userName=""
            class="cursor-pointer"
            :src="nodeData.data?.headImage as string"
          />
        </div>
      </AnnotationsTooltip>
    </template>

    <div v-else class="input-wrap pt-4px pr-2px" :style="inputWrapStyle">
      <a-textarea
        v-model:value="inputValue"
        class="w-100% user-input"
        :auto-size="{
          minRows: 2,
          maxRows: 6,
        }"
        :bordered="false"
        :maxlength="50"
        placeholder="请输入批注内容"
      >
      </a-textarea>
      <div class="btn-wrap">
        <span class="cancel" @click="handleCancel">取消</span>
        <span class="confirm" @click="handleConfirm">发送</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from "vue";
import { useElementSize } from "@vueuse/core";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import AnnotationsTooltip from "./annotations-tooltip.vue";
import { confirmInputConfig } from "../config";
import type { Node, Placement } from "../type";

const props = defineProps({
  element: {
    type: Object,
    default: () => {},
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  node: {
    type: Object as PropType<Node>,
    default: () => {},
  },
  sourceNode: {
    type: Object as PropType<Node>,
    default: () => {},
  },
  svgPosition: {
    type: Object as PropType<any>,
    default: () => {},
  },
  placement: {
    type: String as PropType<Placement>,
    default: "topLeft",
  },
});

const contentDisabled = ref(props.disabled);
const nodeData = ref(props.node);
const inputValue = ref("");
const inputWrapStyle: StyleValue = {
  width: confirmInputConfig.width + "px",
};

watch(inputValue, (val) => {
  // 更新元素内节点输入框内容
  props.element.fire("cacheNodeContent", {
    data: val,
  });
});

const radiusMap = {
  topLeft: "50% 50% 50% 0px",
  topRight: "50% 50% 0px 50%",
  bottomLeft: "0px 50% 50% 50%",
  bottomRight: "50% 0px 50% 50%",
  insideTopLeft: "0px 50% 50% 50%",
}
 
watch(
  [() => props.placement, contentDisabled],
  ([placement, disabled]) => {
    if (disabled) {
      props.element.node.style.borderRadius = radiusMap[placement]
      props.element.node.style.boxShadow = "0px 0px 5px 5px rgba(0,0,0,0.12)"
    } else {
      props.element.node.style.boxShadow = "0px 9px 28px 8px rgba(0,0,0,0.05), 0px 6px 16px 0px rgba(0,0,0,0.08), 0px 3px 6px -4px rgba(0,0,0,0.12)"
    }
  },
  {
    immediate: true,
  }
);

const avatarRadiusMap = {
  topLeft: "50% 50% 50% 0px",
  topRight: "50% 50% 0px 50%",
  bottomLeft: "0px 50% 50% 50%",
  bottomRight: "50% 0px 50% 50%",
  insideTopLeft: "0px 50% 50% 50%",
};
const placementValue = ref();
watch(
  () => props.placement,
  (val) => {
    placementValue.value = val;
  },
  {
    immediate: true,
  }
);
const avatarWrapStyle = computed<StyleValue>(() => {
  return {
    width: confirmInputConfig.avatarWidth + "px",
    height: confirmInputConfig.avatarHeight + "px",
    borderRadius:
      avatarRadiusMap[placementValue.value as keyof typeof avatarRadiusMap],
  };
});

function updatePlacementValue(placement: Placement) {
  placementValue.value = placement;
}

const containerRef = shallowRef();
const { width, height } = useElementSize(containerRef);
watch([width, height], ([val1, val2]) => {
  if (props.element) {
    const { translateX, translateY, placement } =
      props.svgPosition.calcAreaInputPosition(props.sourceNode, val2, val1);

    updatePlacementValue(placement);
    // 平移
    props.element.transform({
      translateX,
      translateY,
    });
    props.element.size(val1, val2);

    props.element.width(val1);
  }
});

function handleCancel() {
  props.element.fire("cancel");
}
const headImage =
  "https://img1.baidu.com/it/u=2988791768,3486679626&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1200";
function handleConfirm() {
  if (!inputValue.value?.trim()) {
    message.warning("批注内容不能为空");
    return;
  }

  const data = {
    headImage,
    nikeName: "",
    html: inputValue.value,
    createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
  props.element.fire("confirm", {
    width: confirmInputConfig.avatarWidth,
    height: confirmInputConfig.avatarHeight,
    data,
  });
}

function updateNodeData(node: Node) {
  nodeData.value = node;
}

function updateDisabled(disabled: boolean) {
  contentDisabled.value = disabled;
}

defineExpose({
  updatePlacementValue,
  updateNodeData,
  updateDisabled,
});
</script>

<style scoped lang="less">
.area-confirm-input {
  display: inline-block;
  box-sizing: border-box;
  z-index: 3;
  position: relative;
}

.avatar-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  user-select: none;
}

.input-wrap {
  background: #ffffff;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05),
    0px 6px 16px 0px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  box-sizing: border-box;

  .btn-wrap {
    display: flex;
    justify-content: flex-end;
    padding: 8px 12px 12px 12px;
    font-family: PingFangSC, PingFang SC;
    font-weight: 400;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);

    .cancel {
      margin-right: 8px;
      cursor: pointer;
      border-radius: 4px;
      border: 1px solid #d9d9d9;
      width: 44px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm {
      width: 44px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: @primary-color;
      cursor: pointer;
      color: #ffffff;
      border-radius: 4px;
    }
  }
}

:global(.area-confirm-input-tooltip .ant-tooltip-inner) {
  max-width: 600px;
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.85);
  padding: 12px;

  .content-wrap {
    .time {
      font-size: 14px;
    }
  }
}

.user-input {
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
