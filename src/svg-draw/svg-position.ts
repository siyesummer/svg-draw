import {
  keyField,
  svgConfig,
  svgShapeConfig,
  svgSubShapeConfig,
} from "./config";
import type { Node, Shape, PathXPositionNode, PathYPositionNode } from "./type";

class SvgPosition {
  svgDraw: any;

  constructor(svgDraw: any) {
    this.svgDraw = svgDraw;
  }

  // 更新节点坐标、图形尺寸
  updateElementPosition() {
    const { nodeData, elementData, effectiveAreaWidth, effectiveAreaHeight } =
      this.svgDraw;

    nodeData.forEach((node: any) => {
      const x = this.calcXPositionOnResize(node);
      const y = this.calcYPositionOnResize(node);

      const element = elementData.find(
        (ele: any) => ele.data(keyField) === node[keyField]
      );

      // 画笔批注
      if (node.shape === svgShapeConfig.painting) {
        const pathStr = this.calcPaintingPosition(node);
        element.plot(pathStr);
        this.svgDraw.moveAnimation(element);
      } else {
        element.move(x, y);
      }

      // 框选批注，重新设置框的尺寸
      if (node.shape === svgShapeConfig.areaConfirmInput) {
        // 输入框
        if (node.sourceKey) {
          const sourceNode = this.svgDraw.nodeData.find(
            (i: any) => i[keyField] === node.sourceKey
          );

          if (sourceNode?._resize) {
            // 尺寸变化时，为了不被遮挡，动态计算定位并重新设置平移
            const { translateX, translateY, placement } =
              this.calcAreaInputPosition(
                sourceNode,
                element.height(),
                element.width()
              );

            // 更新输入框组件位置
            element.fire("updateNode", {
              key: node[keyField],
              shape: node.shape,
              type: "updatePlacementValue",
              value: placement,
            });

            element.transform({
              translateX,
              translateY,
            });
          }
        } else {
          // 矩形
          const percentW = node.width / node.effectiveAreaWidth;
          const percentH = node.height / node.effectiveAreaHeight;
          const width = effectiveAreaWidth * percentW;
          const height = effectiveAreaHeight * percentH;
          // 重新设置尺寸
          element.size(
            effectiveAreaWidth * percentW,
            effectiveAreaHeight * percentH
          );
          // 记录当前尺寸、坐标
          node._resize = {
            x,
            y,
            width,
            height,
          };
        }
      }
    });
  }

  // 内容区域变化时动态计算x轴坐标
  calcXPositionOnResize(node: Node | PathXPositionNode) {
    const {
      x,
      containerWidth: nodeContainerWidth,
      effectiveAreaWidth: nodeEffectiveAreaWidth,
    } = node;
    const { containerWidth, effectiveAreaWidth } = this.svgDraw;
    let positionX = 0;

    // 节点存储
    const nodeLeftAreaWidth =
      nodeContainerWidth / 2 - nodeEffectiveAreaWidth / 2;
    const nodeLeftAreaAndEffectWidth =
      nodeContainerWidth / 2 + nodeEffectiveAreaWidth / 2;

    // 当前
    const leftAreaWidth = containerWidth / 2 - effectiveAreaWidth / 2;
    const leftAreaAndEffectWidth = containerWidth / 2 + effectiveAreaWidth / 2;
    // 有效区域左侧
    if (x < nodeLeftAreaWidth) {
      const percent = x / nodeLeftAreaWidth;

      positionX = leftAreaWidth * percent;
    } else if (x >= nodeLeftAreaWidth && x <= nodeLeftAreaAndEffectWidth) {
      // 有效区域
      const percent = (x - nodeLeftAreaWidth) / nodeEffectiveAreaWidth;

      positionX = leftAreaWidth + effectiveAreaWidth * percent;
    } else {
      // 有效区域右侧
      const percent =
        leftAreaWidth === 0
          ? 0
          : (x - nodeLeftAreaAndEffectWidth) / leftAreaWidth;

      positionX = leftAreaAndEffectWidth + leftAreaWidth * percent;
    }

    return positionX;
  }

  // 内容区域变化时动态计算y轴坐标
  calcYPositionOnResize(node: Node | PathYPositionNode) {
    let positionY = 0;
    const {
      y,
      containerHeight: nodeContainerHeight,
      effectiveAreaHeight: nodeEffectiveAreaHeight,
    } = node;
    const { containerHeight, effectiveAreaHeight } = this.svgDraw;

    // 节点存储
    const nodeTopAreaHeight =
      nodeContainerHeight / 2 - nodeEffectiveAreaHeight / 2;
    const nodeTopAreaAndEffectHeight =
      nodeContainerHeight / 2 + nodeEffectiveAreaHeight / 2;

    // 当前
    const topAreaHeight = containerHeight / 2 - effectiveAreaHeight / 2;
    const topAreaAndEffectHeight =
      containerHeight / 2 + effectiveAreaHeight / 2;

    // 有效区域上方
    if (y < nodeTopAreaHeight) {
      const percent = y / nodeTopAreaHeight;

      positionY = topAreaHeight * percent;
    } else if (y >= nodeTopAreaHeight && y <= nodeTopAreaAndEffectHeight) {
      // 有效区域
      const percent = (y - nodeTopAreaHeight) / nodeEffectiveAreaHeight;

      positionY = topAreaHeight + effectiveAreaHeight * percent;
    } else {
      // 有效区域下方
      const percent = (y - nodeTopAreaAndEffectHeight) / nodeTopAreaHeight;

      positionY = topAreaAndEffectHeight + topAreaHeight * percent;
    }

    return positionY;
  }

  // 计算点在svg中位置
  calcPointPosition(shape: Shape, e: any) {
    const position = {
      x: 0,
      y: 0,
    };
    const path = this.svgDraw.draw.path();
    const point = path.point(e.pageX, e.pageY);
    if (shape) {
      position.x = point.x;
      position.y = point.y;
    }
    path.remove();

    return position;
  }

  /**
   * 计算框选输入框的位置
   * @param {object} sourceNode 输入框对应的矩形节点
   * @param {number} height  输入框区域高度
   * @param {number} width  输入框区域宽度
   * @return {number} translateX 输入框X轴平移数值
   * @return {number} translateY 输入框Y轴平移数值
   */
  calcAreaInputPosition(sourceNode: Node, height: number, width: number) {
    const {
      x,
      y,
      height: sourceNodeHeight = 0,
      width: sourceNodeWidth = 0,
      strokeWidth = svgConfig.strokeWidth,
      _resize,
    } = sourceNode;
    // 输入框高度+stroke高度
    const distanceY = height + (strokeWidth as number);
    // 输入框对应的矩形节点y坐标
    let yVal = y;
    let xVal = x;
    // 输入框对应的矩形节点宽度数值
    let sourceNodeWidthVal = sourceNodeWidth;
    let sourceNodeHeightVal = sourceNodeHeight;
    let placement = "topLeft";
    // resize时矩形节点坐标和宽高改变
    if (_resize) {
      yVal = _resize.y;
      xVal = _resize.x;
      sourceNodeHeightVal = _resize.height;
      sourceNodeWidthVal = _resize.width;
    }
    // 输入框高度未超过矩形顶部到container区域高度
    const yTopUnOver = yVal > distanceY;
    // 输入框Y轴平移数值,超出container高度区域时平移
    let translateY = yTopUnOver
      ? distanceY * -1
      : sourceNodeHeightVal + (strokeWidth as number);
    // 矩形底部+输入框高度超过了container区域高度
    const yOverContainer =
      yVal + sourceNodeHeightVal + height + (strokeWidth as number) * 2 >
      this.svgDraw.containerHeight;

    // 输入框X轴平移数值,超出container宽度区域时平移
    const xOver = xVal + width > this.svgDraw.containerWidth;
    let translateX = xOver ? sourceNodeWidthVal - width : 0;

    if (!yTopUnOver && yOverContainer) {
      translateY = strokeWidth as number;
      translateX = strokeWidth as number;
      placement = "insideTopLeft";
    } else if (xOver && yTopUnOver) {
      placement = "topRight";
    } else if (!yTopUnOver && !xOver) {
      placement = "bottomLeft";
    } else if (!yTopUnOver && xOver) {
      placement = "bottomRight";
    }
    return {
      translateX,
      translateY,
      placement,
    };
  }

  // 通过改变渲染顺序改变图层，解决输入框和头像被遮挡问题
  changeElementOrder() {
    const graphicList: Node[] = [];
    const foreignList: Node[] = [];
    this.svgDraw.nodeData.forEach((node: any) => {
      if (node.shape === svgShapeConfig.areaConfirmInput) {
        if (node.subShape === svgSubShapeConfig.rect) {
          graphicList.push(node);
        } else if (node.subShape === svgSubShapeConfig.confirmInput) {
          foreignList.push(node);
        }
      }
    });

    if (graphicList.length) {
      const lastNode = graphicList[graphicList.length - 1];
      const lastElement = this.svgDraw.elementData.find(
        (ele: any) => ele.data(keyField) === lastNode[keyField]
      );

      if (lastElement) {
        foreignList.forEach((node: any) => {
          const element = this.svgDraw.elementData.find(
            (ele: any) => ele.data(keyField) === node[keyField]
          );

          if (element) {
            const lastElementIndex = this.svgDraw.draw.index(lastElement);
            const elementIndex = this.svgDraw.draw.index(element);

            if (
              lastElementIndex > -1 &&
              elementIndex > -1 &&
              lastElementIndex > elementIndex
            ) {
              element.insertAfter(lastElement);
            }
          }
        });
      }
    }
  }

  /**
   * 计算画笔坐标位置
   * @return {string} pathStr 新的路径数据
   */
  calcPaintingPosition(node: Node) {
    if (node.shape !== svgShapeConfig.painting) return;
    let pathStr = "";
    const {
      containerWidth,
      containerHeight,
      effectiveAreaWidth,
      effectiveAreaHeight,
    } = node;
    node.pathArr?.forEach((position: any) => {
      const x = this.calcXPositionOnResize({
        x: position.x,
        containerWidth,
        effectiveAreaWidth,
      });
      const y = this.calcYPositionOnResize({
        y: position.y,
        containerHeight,
        effectiveAreaHeight,
      });

      if (!pathStr) {
        pathStr = `M${x} ${y}`;
      } else {
        pathStr += `L${x} ${y}`;
      }
    });

    return pathStr;
  }
}

export default SvgPosition;
