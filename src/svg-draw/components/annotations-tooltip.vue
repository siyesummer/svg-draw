<template>
  <a-tooltip
    :trigger="trigger"
    :overlay-className="'annotations-tooltip ' + overlayClassName"
    :overlay-style="overlayStyle"
    :color="color"
    :arrow-point-at-center="arrowPointAtCenter"
    :auto-adjust-overflow="autoAdjustOverflow"
    :destroy-tooltip-on-hide="destroyTooltipOnHide"
  >
    <template #title>
      <div class="annotations-tooltip-content">
        <div
          :class="[
            'annotations-tooltip-item',
            {
              'annotations-border': index !== dataList.length - 1,
            },
          ]"
          v-for="(item, index) in dataList"
          :key="index"
          :style="annotationsTooltipStyle"
        >
          <!-- <div class="time">{{ formatMediaTime(item.data.currentTime) }}</div> -->
          <!-- 框选批注 -->
          <div class="item-content-wrap">
            <div class="item-left">
              <a-avatar
                :size="annotationsTooltipConfig.avatarSize"
                :src="item.data.headImage as string || defaultAvatar"
              ></a-avatar>
            </div>
            <div class="item-right">
              <div class="annotations-info">
                <span class="annotations-name" :title="item.data.nikeName">
                  {{ item.data.nikeName }}
                </span>
                <span
                  class="annotations-create-time"
                  :title="item.data.createTime"
                >
                  {{ item.data.createTime }}
                </span>
              </div>
              <a-textarea
                v-model:value="item.data.html"
                class="w-100% p-0 user-input"
                :auto-size="{
                  minRows: 1,
                  maxRows: maxRows,
                }"
                :bordered="false"
                disabled
                :maxlength="50"
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>
    </template>
    <slot></slot>
  </a-tooltip>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from "vue";
import { annotationsTooltipConfig } from "../config";
import type { Node } from "../type";

const props = defineProps({
  nodeData: {
    type: [Array, Object] as PropType<Node | Node[]>,
    default: () => {},
  },
  color: {
    type: String,
    default: "#ffffff",
  },
  trigger: {
    type: String as PropType<any>,
    default: "hover",
  },
  overlayStyle: {
    type: Object,
    default: () => ({
      maxWidth: "900px",
    }),
  },
  arrowPointAtCenter: {
    type: Boolean,
    default: true,
  },
  autoAdjustOverflow: {
    type: Boolean,
    default: true,
  },
  destroyTooltipOnHide: {
    type: Boolean,
    default: false,
  },
  maxRows: {
    type: Number,
    default: undefined,
  },
  overlayClassName: {
    type: String,
    default: "",
  },
});

const dataList = computed<Node[]>(() => {
  return Array.isArray(props.nodeData) ? props.nodeData : [props.nodeData];
});

const defaultAvatar =
  "https://saasobs.xmonecode.com/fe/yLng9udmdNaBSdjOZWXTQ-38.png";

const annotationsTooltipStyle: StyleValue = {
  width: annotationsTooltipConfig.width + "px",
};

</script>

<style lang="less">
.annotations-tooltip::-webkit-scrollbar {
  display: none;
}
.annotations-tooltip .ant-tooltip-inner {
  font-family: PingFangSC, PingFang SC;
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.85);
  padding: 0 12px;
  .annotations-tooltip-content .annotations-tooltip-item {
    &.annotations-border {
      border-bottom: 1px solid #ebebeb;
    }

    padding: 12px 0;
    .time {
      font-size: 14px;
      margin-bottom: 8px;
    }
    .item-content-wrap {
      display: flex;

      .item-left {
        margin-right: 10px;
        display: flex;
        align-items: flex-start;
      }
      .item-right {
        flex-grow: 1;
        width: 0;
        .annotations-info {
          display: flex;
        }
        .annotations-name {
          // 溢出显示省略号
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .annotations-create-time {
          color: rgba(0, 0, 0, 0.45);
          margin-left: 8px;
          min-width: 122px;
        }

        .ant-input.ant-input-disabled[disabled] {
          cursor: default;
          font-family: PingFangSC, PingFang SC;
          font-weight: 400;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.85);
        }
      }
    }
  }
}

.user-input {
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
