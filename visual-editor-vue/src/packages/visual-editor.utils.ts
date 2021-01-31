
import { VisualEditor } from './visual-editor';
import { VisualEditorProps } from './visual-editor-props';

export interface VisualEditorBlockData {
  componentKey: string,
  top: number, //组件top定位
  left: number,
  adjustPosition: boolean, //是否需要调整位置
  focus: boolean, //当前是否被选中状态
  zIndex: number,
  width: number,
  height: number,
  hasResize: boolean, //是否调整过宽高
  props: Record<string, any>, //组件设计属性
  model: Record<string, string>,//绑定字段
}


export interface VisualEditorModelValue {
  container: {
    width: number,
    height: number
  },
  blocks?: VisualEditorBlockData[]
}
export interface VisualEditorComponent { //自定义组件类型
  key: string,
  label: string,
  preview: () => JSX.Element,
  render: (data: { props: any,model:any }) => JSX.Element,
  props?: Record<string, VisualEditorProps>,
  model?:Record<string,string>
}
export interface VisualEditorMarkLines {
  x: { left: number, showLeft: number }[],
  y: { top: number, showTop: number }[]
}
export function createNewBlock({
  component,
  left,
  top
}: {
  component: VisualEditorComponent,
  left: number,
  top: number
}): VisualEditorBlockData {
  return {
    top,
    left,
    componentKey: component!.key,
    adjustPosition: true,
    focus: false,
    zIndex: 0,
    width: 0,
    height: 0,
    hasResize: false,
    props: {},
    model: {},
  }
}
export function createVisualEditorConfig() {
  const componentList: VisualEditorComponent[] = []; //将自定义的组件保存起来
  const componentMap: Record<string, VisualEditorComponent> = {}; //通过map映射表  通过name来查找对应组件
  return {
    componentList,
    componentMap,
    registry: <_,
      Props extends Record<string, VisualEditorProps> = {},
      Model extends Record<string, string> = {},
      >(key: string, component: {
        label: string,
        preview: () => JSX.Element,
        render: (data: {
          props: { [k in keyof Props]: any },
          model: Partial<{
            [k in keyof Model]: any
            //  {
            //   // field: string,
            //   // row: any,
            //   // binding: {
            //     value: any,
            //     onChange: (val: any) => void
            //   // },

            // } 
          }
          >,
        }) => JSX.Element,
        props?: Props,
        model?: Model
      }) => { //注册组件
      let comp = { ...component, key };
      componentList.push(comp);
      componentMap[key] = comp;
    },
  }
}
export type VisualEditorConfig = ReturnType<typeof createVisualEditorConfig>