export type Shape =
  | null
  | undefined
  | "text-input"
  | "confirm-input"
  | "area-confirm-input"
  | "painting";

export type SubShape = null | undefined | "rect" | "confirm-input";

export interface DrawOptions {
  beforeTrigger?: Function;
  trigger?: Function;
  [key: string]: any;
}

// 节点自定义数据
export interface NodeData {
  // 批注时间
  time?: number;
  // 自定义节点模式  编辑、查看等状态
  mode?: string;
  [key: string]: any;
}

// svg节点
export interface Node {
  // 节点唯一标识
  key: string;
  // 节点类型
  shape: Shape;
  // 节点子类型（组合元素）
  subShape?: SubShape;
  // 区域宽度
  containerWidth: number;
  // 区域高度
  containerHeight: number;
  // 有效区域宽度
  effectiveAreaWidth: number;
  // 有效区域高度
  effectiveAreaHeight: number;
  // 节点宽度，单位为 px。
  width?: number;
  // 节点高度，单位为 px。
  height?: number;
  // 路径数据
  path?: string;
  // 路径坐标
  pathArr?: array[];
  // 节点位置 x 坐标，单位为 px。
  x: number;
  // 节点位置 y 坐标，单位为 px。
  y: number;
  // 关联节点key
  sourceKey?: string;
  // 关联节点
  sourceNode?: Node;
  // 节点相关数据
  data: NodeData;
  // 视频版式
  plate?: string;
  strokeColor?: string;
  strokeWidth?: string;
  radius?: number;
  _resize?: { [key: string]: any };
  // 编辑时content暂存
  _content?: string;
  // 保存标记
  _saved: boolean;
}

// svg节点
export interface NodeCommon {
  // 节点唯一标识
  key: string;
  // 节点类型
  shape: Shape;
}

export interface ConfirmInputDataValue {
  headImage: string;
  nikeName: string;
  html: string;
  createTime: string;
  currentTime: number;
}

export type VideoPlate = "horizontal" | "vertical" | "square" | undefined;

export type AssetsType = "video" | "picture" | "audio" | undefined;

export type Placement =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "insideTopLeft";

export type PathXPositionNode = Pick<
  Node,
  "x" | "containerWidth" | "effectiveAreaWidth"
>;

export type PathYPositionNode = Pick<
  Node,
  "y" | "containerHeight" | "effectiveAreaHeight"
>;
