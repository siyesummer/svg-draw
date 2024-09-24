import { createVNode, render } from "vue";
import type { Component } from "vue";
import { SVG } from "@svgdotjs/svg.js";
import { throttle, cloneDeep } from "lodash-es";
import SvgPosition from "./svg-position";
import {
  svgConfig,
  confirmInputConfig,
  keyField,
  textInputConfig,
  dotConfirmInputConfig,
  svgShapeConfig,
  svgSubShapeConfig,
} from "./config";
import type { Shape, DrawOptions, Node, VideoPlate, AssetsType } from "./type";
import DotConfirmInput from "./components/dot-confirm-input.vue";
import ConfirmInput from "./components/confirm-input.vue";
import TextInput from "./components/text-input.vue";

function getUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

const defaultOptions = () => ({
  // svg区域宽度
  width: "100%",
  // svg区域高度
  height: "100%",
  ...svgConfig,
});

const defaultNodeData = () => ({
  // 节点唯一标识
  key: "",
  // 节点类型
  shape: "",
  // 节点宽度，单位为 px。
  width: undefined,
  // 节点高度，单位为 px。
  height: undefined,
  // 路径数据
  path: "",
  // 节点位置 x 坐标，单位为 px。
  x: 0,
  // 节点位置 y 坐标，单位为 px。
  y: 0,
  // 节点相关数据
  data: {},
  // 保存标记
  _saved: false,
});

/**
 * svg绘画
 * @doc https://svgjs.dev/docs/3.1/getting-started/
 */
class SvgDraw {
  // 实例
  draw: any;
  // SvgPosition实例
  svgPosition: any;
  // 配置项
  options: DrawOptions;
  // 节点类型
  shape: Shape = null;
  // 节点数据
  nodeData: Node[] = [];
  // 节点对应svg元素暂存
  elementData: any[] = [];
  // 区域宽度
  containerWidth = 0;
  // 区域高度
  containerHeight = 0;
  // 有效区域宽度
  effectiveAreaWidth = 0;
  // 有效区域高度
  effectiveAreaHeight = 0;
  // 视频版式
  videoPlat: VideoPlate;
  // 视频当前播放时间
  currentTime = 0;
  // 素材文件类型
  assetsType: AssetsType;

  constructor(container: string | HTMLElement, options?: DrawOptions) {
    if (!options) options = {};
    this.options = {
      ...defaultOptions(),
      ...options,
    };
    this.createDraw(container);

    this.svgPosition = new SvgPosition(this);

    this.addDrawEvent();
  }

  createDraw(container: string | HTMLElement) {
    const el =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    const width = this.options.width;
    const height = this.options.height;
    this.draw = SVG()
      .addTo(el as HTMLElement)
      .size(width, height);
  }

  setShape(shape: Shape) {
    this.shape = shape;
  }

  setVideoPlat(videoPlat: VideoPlate) {
    this.videoPlat = videoPlat;
  }

  setAssetsType(assetsType: AssetsType) {
    this.assetsType = assetsType;
  }

  updateOptions(options: DrawOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  updateContainer(
    width: number,
    height: number,
    effectWidth = 0,
    effectHeight = 0
  ) {
    const oldWidth = this.containerWidth;
    const oldEffectWidth = this.effectiveAreaWidth;
    this.containerWidth = width;
    this.containerHeight = height;

    this.effectiveAreaWidth = effectWidth;
    this.effectiveAreaHeight = effectHeight;

    if (oldWidth !== 0 && oldEffectWidth !== 0)
      this.svgPosition.updateElementPosition();
  }

  updateCurrentTime(currentTime: number) {
    this.currentTime = isNaN(currentTime) ? 0 : currentTime;
  }

  addDrawEvent() {
    if (!this.draw) return;

    this.addDrawClickEvent();

    this.addDrawDragEvent();
  }

  addDrawClickEvent() {
    this.draw.click((e: any) => {
      if (!this.shape) return;

      // 圆点批注/文本批注
      if (
        this.shape === svgShapeConfig.confirmInput ||
        this.shape === svgShapeConfig.textInput
      ) {
        // 查找是否有未保存节点
        let node: Node | undefined = this.nodeData.find(
          (i) => i.shape === this.shape && !i._saved
        );
        // 节点对应元素
        let ele: any = node
          ? this.elementData.find((i) => node?.[keyField] === i.data(keyField))
          : null;

        if (!node) {
          const uuid = getUUID();
          ele = this.genElement(this.shape, uuid);

          if (ele) {
            // 元素存储
            this.elementData.push(ele);

            const nodeData = this.genNode({
              shape: this.shape,
              [keyField]: uuid,
            });
            node = nodeData;
            // 节点存储
            this.nodeData.push(nodeData);
          }
        }

        const position = this.svgPosition.calcPointPosition(this.shape, e);
        ele.move(position.x, position.y);

        if (!node) return;
        node.x = position.x;
        node.y = position.y;
        // 更新节点区域信息，解决宽高变化时重新定位不准确问题
        node.effectiveAreaWidth = this.effectiveAreaWidth;
        node.effectiveAreaHeight = this.effectiveAreaHeight;
        node.containerWidth = this.containerWidth;
        node.containerHeight = this.containerHeight;
      }
    });
  }

  addDrawDragEvent() {
    this.addPaintingEvent();

    this.addAreaEvent();
  }

  // 画笔功能
  addPaintingEvent() {
    let isStart = false;
    let pathEle: any;
    let pathStr = "";
    let pathArr: any[] = [];

    this.draw.mousedown((e: any) => {
      if (this.shape !== svgShapeConfig.painting) return;

      isStart = true;

      const position = this.svgPosition.calcPointPosition(this.shape, e);
      pathStr = `M${position.x} ${position.y}`;
      pathArr.push(position);

      pathEle = this.draw
        .path(pathStr)
        .stroke({
          color: this.options.strokeColor,
          width: this.options.strokeWidth,
        })
        .fill("none");

      this.moveAnimation(pathEle);
    });

    const handleContainerMove = (e: any) => {
      if (!isStart) return;

      const position = this.svgPosition.calcPointPosition(this.shape, e);

      pathStr += `L${position.x} ${position.y}`;

      pathArr.push(position);

      pathEle.plot(pathStr).animate(0, 0);
    };

    const moveFun = throttle(handleContainerMove, 30);

    this.draw.mousemove(moveFun);

    this.draw.mouseup(() => {
      if (pathEle) {
        const key = getUUID();

        pathEle.data({
          [keyField]: key,
        });

        this.elementData.push(pathEle);

        const nodeData = this.genNode({
          shape: this.shape,
          [keyField]: key,
          path: pathStr,
          pathArr,
        });

        this.nodeData.push(nodeData);
      }
      isStart = false;
      pathEle = null;
      pathStr = "";
      pathArr = [];
    });
  }

  // 框选批注
  addAreaEvent() {
    let isStart = false;
    let rectEle: any;
    const startPosition = {
      x: 0,
      y: 0,
    };

    // 区域外放手时，去除框选矩型元素，需重新框选
    window.addEventListener("mouseup", () => {
      if (rectEle) {
        rectEle.remove();
      }
      isStart = false;
      rectEle = null;
    });

    this.draw.mousedown((e: any) => {
      if (this.shape !== svgShapeConfig.areaConfirmInput) return;

      isStart = true;
      const position = this.svgPosition.calcPointPosition(this.shape, e);

      startPosition.x = position.x;
      startPosition.y = position.y;
    });
    // 鼠标点击后移动时，动态计算矩形的起点和宽高
    const handleContainerMove = (e: any) => {
      if (!isStart) return;

      const position = this.svgPosition.calcPointPosition(this.shape, e);

      const dx = Math.abs(startPosition.x - position.x);
      const dy = Math.abs(startPosition.y - position.y);

      // 框选区域时
      if (
        !rectEle &&
        dx > this.options.areaDragCritical &&
        dy > this.options.areaDragCritical
      ) {
        const unSavedNode = this.nodeData.find(
          (i: any) =>
            i.shape === svgShapeConfig.areaConfirmInput &&
            !i._saved &&
            i.sourceKey
        );

        if (unSavedNode)
          this.deleteNodeAndElementByKeys([
            unSavedNode[keyField],
            unSavedNode.sourceKey as string,
          ]);

        // 新增框选矩形
        rectEle = this.draw
          .rect()
          .stroke({
            color: this.options.strokeColor,
            width: this.options.strokeWidth,
          })
          .radius(this.options.radius)
          .fill("none");
        // 移除动画效果
        this.moveAnimation(rectEle);
      }

      if (rectEle) {
        const { x, y } = this.getAreaConfirmStartPosition(
          startPosition,
          position
        );
        // 起点和尺寸动态变更
        rectEle.size(dx, dy).move(x, y);
      }
    };

    const moveFun = throttle(handleContainerMove, 30);

    this.draw.mousemove(moveFun);

    this.draw.mouseup(() => {
      if (rectEle) {
        const key = getUUID();

        // 保存框选元素
        rectEle.data({
          [keyField]: key,
        });
        this.elementData.push(rectEle);
        // 保存框选节点
        const nodeData = this.genNode({
          shape: this.shape,
          subShape: svgSubShapeConfig.rect,
          [keyField]: key,
          x: rectEle.x(),
          y: rectEle.y(),
          width: rectEle.width(),
          height: rectEle.height(),
          strokeColor: this.options.strokeColor,
          strokeWidth: this.options.strokeWidth,
          radius: this.options.radius,
        });
        this.nodeData.push(nodeData);

        const eleKey = getUUID();
        const eleNodeDataParams = this.genNode({
          shape: this.shape,
          subShape: svgSubShapeConfig.confirmInput,
          [keyField]: eleKey,
          sourceKey: key,
        });
        // 含确认输入框
        const ele = this.genElement(this.shape, undefined, {
          // 对应矩形节点
          sourceNode: nodeData,
          node: eleNodeDataParams,
          svgPosition: this.svgPosition,
        });
        ele.data({
          [keyField]: eleKey,
          sourceKey: key,
        });
        ele.move(rectEle.x(), rectEle.y());
        this.elementData.push(ele);

        // 含确认输入框节点
        Object.assign(eleNodeDataParams, {
          x: ele.x(),
          y: ele.y(),
          width: ele.width(),
          height: ele.height(),
        });
        const eleNodeData = this.genNode(eleNodeDataParams);

        this.nodeData.push(eleNodeData);
      }
      isStart = false;
      rectEle = null;
    });
  }

  // 框选批注起点坐标
  getAreaConfirmStartPosition(
    startPosition: { x: number; y: number },
    position: { x: number; y: number }
  ) {
    return {
      x: startPosition.x <= position.x ? startPosition.x : position.x,
      y: startPosition.y <= position.y ? startPosition.y : position.y,
    };
  }

  // 生成foreignObject元素
  genForeignObject(
    width: number,
    height: number,
    comp: Component,
    props?: { [key: string]: any }
  ) {
    if (!this.draw) return {};
    if (!props) props = {};
    // 创建一个foreignObject，并控制尺寸
    const foreignObject = this.draw.foreignObject(width, height);
    // vue组件生成VNode，并将VNode渲染到foreignObject元素内
    const vm = createVNode(comp, { ...props, element: foreignObject }) as any;
    render(vm, foreignObject.node as any);

    return { foreignObject, vm };
  }

  // 创建svg元素
  genElement(shape: Shape, key?: string, props?: { [key: string]: any }) {
    let ele: any;
    let vmVal: any;
    if (!props) props = {};
    if (shape === svgShapeConfig.confirmInput) {
      const { foreignObject } = this.genForeignObject(
        dotConfirmInputConfig.width,
        dotConfirmInputConfig.height,
        DotConfirmInput,
        { ...props }
      );
      ele = foreignObject;
      // 平移
      ele.transform({
        translateX: Number(`-${dotConfirmInputConfig.width / 2}`),
        translateY: Number(`-${dotConfirmInputConfig.height}`),
      });
    } else if (shape === svgShapeConfig.textInput) {
      const { foreignObject } = this.genForeignObject(
        textInputConfig.width,
        textInputConfig.height,
        TextInput,
        {
          color: this.options.strokeColor,
          ...props,
        }
      );
      ele = foreignObject;
    } else if (shape === svgShapeConfig.areaConfirmInput) {
      const { translateX, translateY, placement } =
        this.svgPosition.calcAreaInputPosition(
          props.sourceNode,
          confirmInputConfig.height,
          confirmInputConfig.width
        );
      const { foreignObject, vm } = this.genForeignObject(
        confirmInputConfig.width,
        confirmInputConfig.height,
        ConfirmInput,
        {
          placement,
          ...props,
        }
      );
      ele = foreignObject;
      vmVal = vm;
      // 平移
      ele.transform({
        translateX,
        translateY,
      });

      // 更新节点事件
      ele.on("updateNode", (e: any) => {
        const { type, value } = e.detail || {};
        // 更新位置
        if (type === "updatePlacementValue") {
          vm?.component?.exposed?.updatePlacementValue &&
            vm.component.exposed.updatePlacementValue(value);
        }
      });
    }

    if (ele) {
      this.moveAnimation(ele);

      // 输入框取消事件
      ele.on("cancel", () => {
        const key = ele.data(keyField);

        const target = this.nodeData.find((i: any) => i[keyField] === key);
        if (target) {
          const keyList = [target[keyField], target.sourceKey]?.filter(
            (key?: string) => !!key
          );

          this.deleteNodeAndElementByKeys(keyList as string[]);
        }
      });

      // 输入框确定事件
      ele.on("confirm", (e: any) => {
        // 事件触发前校验，返回false则不触发options内trigger
        if (typeof this.options.beforeTrigger === "function") {
          if (!this.options.beforeTrigger("confirm", e)) {
            return;
          }
        }
        const node = this.nodeData.find(
          (i: any) => i[keyField] === ele.data(keyField)
        );
        let sourceNode;
        if (node) {
          // 保存标记
          node._saved = true;
          if (node.sourceKey) {
            sourceNode = this.nodeData.find(
              (i: any) => i[keyField] === node.sourceKey
            );
            if (sourceNode) {
              sourceNode._saved = true;
            }
          }
          const { width = 0, height = 0, data = {} } = e.detail;
          const dataValue = {
            ...data,
          };
          if (node.shape === svgShapeConfig.areaConfirmInput) {
            dataValue.currentTime = this.currentTime;
          }
          Object.assign(node, {
            width,
            height,
            data: dataValue,
          });

          console.log('node', node);
          
          vmVal?.component?.exposed?.updateNodeData(node);
          vmVal?.component?.exposed?.updateDisabled(true);
        }

        if (this.options.trigger) {
          // 事件触发
          this.options.trigger("confirm", {
            e,
            node: cloneDeep(node),
            sourceNode: cloneDeep(sourceNode),
          });
        }

        // 变更元素渲染顺序，解决输入框和头像被遮挡问题
        this.svgPosition.changeElementOrder();
      });

      // 更新元素内节点数据
      ele.on("updateNodeData", (e: any) => {
        if (e.detail.node) {
          vmVal?.component?.exposed?.updateNodeData(e.detail.node);
        }
      });

      // 更新元素内节点输入框内容
      ele.on("cacheNodeContent", (e: any) => {
        const node = this.nodeData.find(
          (i: any) => i[keyField] === ele.data(keyField)
        );
        if (node) {
          node._content = e.detail.data;
        }
      });
    }

    if (ele && key)
      ele.data({
        [keyField]: key,
      });

    return ele;
  }

  // 创建节点数据
  genNode(attrs: any) {
    const data = {
      ...defaultNodeData(),
      containerWidth: this.containerWidth,
      containerHeight: this.containerHeight,
      effectiveAreaWidth: this.effectiveAreaWidth,
      // 有效区域高度
      effectiveAreaHeight: this.effectiveAreaHeight,
      ...attrs,
    };

    if (!data[keyField]) data[keyField] = getUUID();

    if (data.shape === svgShapeConfig.confirmInput) {
      data.width = dotConfirmInputConfig.width;
      data.height = dotConfirmInputConfig.height;
    } else if (data.shape === svgShapeConfig.textInput) {
      data.width = textInputConfig.width;
      data.height = textInputConfig.height;
    }

    return data;
  }

  moveAnimation(ele: any) {
    const runner = ele.animate();
    runner.unschedule();

    ele.timeline().stop();
  }

  /**
   * 更新节点批注内容
   * @param {Node | Node[]} 更新了data数据的节点数据
   */
  updateNodeDataByNodes(node: Node | Node[]) {
    const nodeList = Array.isArray(node) ? node : [node];
    const updateNodeKeys: any[] = [];
    const updateNodeMap: any = {};
    nodeList.forEach((i: Node) => {
      const key = i[keyField];
      updateNodeKeys.push(key);
      updateNodeMap[key] = i;
    });

    this.nodeData.forEach((node: Node) => {
      const key = node[keyField];
      if (updateNodeKeys.includes(key)) {
        node.data = cloneDeep(updateNodeMap[key].data);

        const ele = this.elementData.find((i: any) => i.data(keyField) === key);

        if (ele) {
          // 触发元素绑定的数据更新事件
          ele.fire("updateNodeData", {
            node,
          });
        }
      }
    });
  }

  /**
   * 删除节点数据和元素
   * @param {string | string[]} key 节点/元素对应的key
   */
  deleteNodeAndElementByKeys(key: string | string[]) {
    const keyList = Array.isArray(key) ? key : [key];

    this.nodeData = this.nodeData.filter(
      (i: any) => !keyList.includes(i[keyField])
    );

    const elementList: any[] = [];

    this.elementData.forEach((i: any) => {
      if (keyList.includes(i.data(keyField))) {
        i.remove();
      } else {
        elementList.push(i);
      }
    });

    this.elementData = elementList;
  }

  // 清空svg图形和数据
  clear() {
    this.draw && this.draw.clear();

    this.nodeData = [];
    this.elementData = [];
  }

  sleep(time = 10) {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  }

  // 获取未保存且有内容的节点
  getUnSavedNode() {
    const nodes = this.nodeData?.filter((i: any) => {
      if (!i._saved) {
        if (
          i.shape === svgShapeConfig.areaConfirmInput &&
          i.subShape === svgSubShapeConfig.confirmInput
        ) {
          if (i._content?.trim()) return true;
        }
      }

      return false;
    });

    return nodes;
  }

  /**
   * 渲染节点
   * @param {Array<Node>} nodeData 渲染的节点数据
   * @param {boolean} clear 清除旧数据
   */
  async renderNodes(nodeData: Node[], clear = true) {
    if (clear) this.clear();
    const nodeList: any[] = [];

    nodeData.forEach((i: any) => {
      // 默认后渲染的图层更高
      if (i.sourceNode) nodeList.push(i.sourceNode);
      nodeList.push(i);
    });

    this.nodeData.push(...nodeList);

    await this.sleep(100);

    nodeList.forEach((node: Node) => {
      // 框选批注
      if (node.shape === svgShapeConfig.areaConfirmInput) {
        const {
          shape,
          x,
          y,
          width,
          height,
          strokeColor,
          strokeWidth,
          radius,
          _saved,
          subShape,
          sourceNode,
        } = node;
        let ele: any;
        // 输入框
        if (subShape === svgSubShapeConfig.confirmInput) {
          ele = this.genElement(shape, node[keyField], {
            node,
            sourceNode,
            svgPosition: this.svgPosition,
            disabled: _saved,
          });
          ele.move(x, y);
        } else if (subShape === svgSubShapeConfig.rect) {
          // 矩形
          ele = this.draw
            .rect()
            .stroke({
              color: strokeColor,
              width: strokeWidth,
            })
            .radius(radius)
            .fill("none")
            .size(width, height)
            .move(x, y);
        }

        // 设置key
        ele.data(keyField, node[keyField]);
        // 元素存储
        this.elementData.push(ele);
      }
    });

    // 更新坐标、尺寸
    this.svgPosition.updateElementPosition();
    // 变更元素渲染顺序，解决输入框和头像被遮挡问题
    this.svgPosition.changeElementOrder();
  }
}

export default SvgDraw;
