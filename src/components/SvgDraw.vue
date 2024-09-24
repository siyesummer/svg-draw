<template>
  <div class="action-wrap">
    <a-button-group>
      <a-button
        v-for="item in btnList"
        :key="item.value"
        :type="shape === item.value ? 'primary' : 'default'"
        @click="handleClick(item)"
      >
        {{ item.label }}
      </a-button>
    </a-button-group>
  </div>
  <div ref="containerRef" class="container">
    <div ref="svgRef" class="svg"></div>
    <img ref="effectRef" :src="bg" class="content"></img>
  </div>
</template>

<script setup lang="ts">
import useDraw from "../svg-draw/use-svg-draw";
import { svgShapeConfig } from "../svg-draw/config";

const shape = ref(svgShapeConfig.areaConfirmInput);
const bg = "https://k.sinaimg.cn/n/sinakd20240612s/491/w1200h1691/20240612/ef22-d0c8527082ec72752eed4ed9e14fafa2.jpg/w700d1q75cms.jpg?by=cms_fixed_width"
const btnList = [
  { label: "框选批注", value: svgShapeConfig.areaConfirmInput, shape: true },
  { label: "画笔批注", value: svgShapeConfig.painting, shape: true },
  { label: "清空", value: "clear" },
];

const containerRef = shallowRef();
const svgRef = shallowRef();
const effectRef = shallowRef();

const { draw } = useDraw({
  svgRef,
  containerRef,
  effectRef
})

function handleClick(item: any) {
  if (item.shape) {
    shape.value = item.value;
    draw.value.setShape(shape.value);
  } else {
    if (item.value === "clear") {
      draw.value.clear();
    }
  }
}
onMounted(() => {
  draw.value.setShape("area-confirm-input");
});
</script>

<style scoped lang="less">
.action-wrap {
  margin: 15px 0;
}

.container {
  width: 80%;
  height: calc(100% - 95px);
  position: relative;
  background-color: #F6F7F9;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;

  .svg {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .content {
    // width: 80%;
    max-height: 100%;
  }
}
</style>
