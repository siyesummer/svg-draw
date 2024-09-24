import SvgDraw from "./index";
import { useElementSize } from "@vueuse/core";
import type { VideoPlate, AssetsType, Shape, DrawOptions } from "./type";

export default (
  {
    svgRef,
    containerRef,
    effectRef,
    plate,
    autoCreate = true,
    assetsType,
  }: {
    // svg绑定的dom
    svgRef: Ref<HTMLElement>;
    // svg操作范围绑定的dom
    containerRef: Ref<HTMLElement>;
    // svg有效区域绑定的dom
    effectRef: Ref<HTMLElement>;
    // 视频版式
    plate?: VideoPlate;
    // 配置组件渲染完成后是否自动创建draw
    autoCreate?: boolean;
    // 资产类型
    assetsType?: AssetsType;
  },
  options?: DrawOptions
) => {
  // draw实例存储
  const draw = shallowRef();
  // 批注类型
  const annotationsShape = ref<Shape>();
  // 资产类型
  const drawAssetType = ref(assetsType);

  // 创建svgDraw
  function createDraw(plate: VideoPlate, assetsType: AssetsType) {
    draw.value = new SvgDraw(svgRef.value as HTMLElement, options);
    draw.value.setVideoPlat(plate);
    draw.value.setAssetsType(assetsType);

    return draw;
  }

  onMounted(() => {
    // 默认组件渲染完成后创建draw
    if (autoCreate) createDraw(plate, assetsType);
  });

  // svg操作范围
  const { width, height } = useElementSize(containerRef);
  // 有效区域
  const { width: videoWidth, height: videoHeight } = useElementSize(effectRef);
  // 浏览器resize时，跟新svg内元素的定位、尺寸
  watch(
    [width, height, videoWidth, videoHeight],
    ([val1, val2, val3, val4]) => {
      draw.value && draw.value.updateContainer(val1, val2, val3, val4);
    }
  );

  // 同步设置svg内shape
  watch(annotationsShape, (val) => {
    draw.value && draw.value.setShape(val);
  });

  watch(drawAssetType, (val) => {
    draw.value && draw.value.setAssetsType(val);
  });

  return { draw, createDraw, annotationsShape, drawAssetType };
};
