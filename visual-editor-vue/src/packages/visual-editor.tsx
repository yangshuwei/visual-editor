import { ref, computed, defineComponent, PropType, withCtx, reactive } from 'vue';
import { createEvent } from './plugins/event';
import { $$dialog } from './utils/dialog-service';
import { $$dropdown, DropdownOption } from './utils/dropdown-service';
import { useModel } from './utils/useModule';
import { useVisualCommand } from './utils/visual.command';
import { VisualEditorBlock } from './visual-editor-block';
import { VisualOperatorEditor } from './visual-editor-operator';
import './visual-editor.scss';
import { createNewBlock, VisualEditorBlockData, VisualEditorComponent, VisualEditorConfig, VisualEditorMarkLines, VisualEditorModelValue } from './visual-editor.utils';
export const VisualEditor = defineComponent({
  props: {
    modelValue: { type: Object as PropType<VisualEditorModelValue>, required: true },
    config: { type: Object as PropType<VisualEditorConfig>, required: true },
    formData: { type: Object as PropType<Record<string, any>>, required: true }
  },
  emits: {
    'update:modelValue': (val?: VisualEditorModelValue) => true,
  },
  setup(props, ctx) {
    //双向数据绑定
    const dataModel = useModel(() => props.modelValue, (val) => ctx.emit('update:modelValue', val));
    const containerStyle = computed(() => ({
      width: `${dataModel.value?.container.width}px`,
      height: `${dataModel.value?.container.height}px`
    }))

    //ref  获取dom元素对象
    const containerRef = ref({} as HTMLDivElement);

    const focusData = computed(() => {
      let focus: VisualEditorBlockData[] = [];//选中的数据
      let unFocus: VisualEditorBlockData[] = [];
      (dataModel.value.blocks || []).forEach(block => (block.focus ? focus : unFocus).push(block));
      return {
        focus,
        unFocus
      }
    })
    const dragstart = createEvent();
    const dragend = createEvent();
    const selectIndex = ref(-1)
    const state = reactive({

      // selectIndex:-1,
      // selectBlock: undefined as undefined | VisualEditorBlockData, //容器内当前选中的组件
      selectBlock: computed(() => (dataModel.value.blocks || [])[selectIndex.value]),
      preview: true,
      editing:true,
    })
    const classes = computed(() => [
      'visual-editor',
      {
        'visual-editor-not-preview': !state.preview
      }
    ])
    const methods = {
      openEdit:()=>{
        state.editing = true;
      },
      //清除选中状态
      clearFocus: (block?: VisualEditorBlockData) => {
        let blocks = (dataModel.value.blocks || []);
        if (blocks.length === 0) return;
        if (!!block) {
          blocks = blocks.filter(b => b !== block);
        }
        blocks.forEach(block => block.focus = false);
      },
      updateBlocks: (blocks: VisualEditorBlockData[]) => {
        dataModel.value = {
          ...dataModel.value, blocks
        }
      },
      // updataBlock: (newBlock:VisualEditorBlockData,oldBlock:VisualEditorBlockData) => {
      //   const blocks = [...dataModel.value.blocks||[]];
      //   const index = blocks.indexOf(oldBlock)
      //   if(index>-1){

      //   }
      //  },
      showBlockData: (block: VisualEditorBlockData) => {
        $$dialog.textarea(JSON.stringify(block))
      },
      importBlockData: async (block: VisualEditorBlockData) => {
        const text = await $$dialog.textarea();
        try {
          const data = JSON.parse(text || '')
          commander.updateBlock(data, block)
        } catch (error) {
          console.log(error)
        }
      }
    }
    const menuDraggier = (() => {
      //闭包只对外暴露start，end
      let component = null as null | VisualEditorComponent;
      const blockHandler = { //左侧组件库拖拽相关
        dragstart: (e: DragEvent, current: VisualEditorComponent) => {
          containerRef.value.addEventListener('dragenter', containerHandler.dragenter);
          containerRef.value.addEventListener('dragover', containerHandler.dragover);
          containerRef.value.addEventListener('dragleave', containerHandler.dragleave);
          containerRef.value.addEventListener('drop', containerHandler.drop);
          component = current;
          dragstart.emit()
        },
        dragend: (e: DragEvent) => {
          containerRef.value.removeEventListener('dragenter', containerHandler.dragenter);
          containerRef.value.removeEventListener('dragover', containerHandler.dragover);
          containerRef.value.removeEventListener('dragleave', containerHandler.dragleave);
          containerRef.value.removeEventListener('drop', containerHandler.drop);
          component = null;
          // dragend()
        },
      }
      const containerHandler = { //容器内可放置拖进来的组件
        dragenter: (e: DragEvent) => {
          e.dataTransfer!.dropEffect = 'move';
        },
        dragover: (e: DragEvent) => {
          e.preventDefault();
        },
        dragleave: (e: DragEvent) => {
          e.dataTransfer!.dropEffect = 'none'
        },
        drop: (e: DragEvent) => {

          const blocks = [...dataModel.value.blocks || []];
          blocks.push(createNewBlock({ component: component!, top: e.offsetY, left: e.offsetX }))  //创建容器中已放置的组件
          methods.updateBlocks(blocks)
          dragend.emit()
          // dataModel.value = {...dataModel.value,blocks}
        }
      }
      return blockHandler;


    })()
    const focusHandler = (() => {
      return {
        container: { //容器空白触发清除所有已选组件状态
          onMousedown: (e: MouseEvent) => {
            if (state.preview) return;
            // e.stopPropagation();
            e.preventDefault();
            if (e.currentTarget !== e.target) return;

            if (!e.shiftKey) {
              methods.clearFocus()
              selectIndex.value = -1
              // state.selectBlock = undefined
            }

          }
        },
        block: {
          onMousedown: (e: MouseEvent, block: VisualEditorBlockData, index: number) => {
            if (state.preview) return;
            if (e.shiftKey) {
              if (focusData.value.focus.length <= 1) {
                block.focus = true;
              } else {
                block.focus = !block.focus
              }
            } else {
              if (!block.focus) {
                block.focus = true;
                methods.clearFocus(block);
              }
            }
            // state.selectBlock = block
            selectIndex.value = index
            blcokDraggier.mousedown(e);
          }
        }
      }
    })();


    const blcokDraggier = (() => {  //容器内已选取组件拖拽 位置调整
      const mark = reactive({
        x: null as null | number,
        y: null as null | number
      })
      let dragState = {
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        startPos: [] as { left: number, top: number }[],
        dragging: false,
        markLines: {} as VisualEditorMarkLines
      }
      const mousedown = (e: MouseEvent) => {
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startLeft: state.selectBlock!.left,
          startTop: state.selectBlock!.top,
          startPos: focusData.value.focus.map(({ top, left }) => ({ top, left })),
          dragging: false,
          markLines: (() => {
            const { focus, unFocus } = focusData.value;
            const { top, left, width, height } = state.selectBlock!;
            let lines: VisualEditorMarkLines = { x: [], y: [] } as VisualEditorMarkLines;
            [...unFocus, {
              top: 0,
              left: 0,
              width: dataModel.value.container.width,
              height: dataModel.value.container.height
            }].forEach(block => {
              const { top: t, left: l, width: w, height: h } = block
              lines.y.push({ top: t, showTop: t }) //顶部对顶部
              lines.y.push({ top: t + h, showTop: t + h }) //顶部对底部
              lines.y.push({ top: t + h / 2 - height / 2, showTop: t + h / 2 }) //中间对中间
              lines.y.push({ top: t - height, showTop: t }) //底部对顶部
              lines.y.push({ top: t + h - height, showTop: t + h }) //底部对底部


              lines.x.push({ left: l, showLeft: l }) //顶部对顶部
              lines.x.push({ left: l + w, showLeft: l + w }) //顶部对底部
              lines.x.push({ left: l + w / 2 - width / 2, showLeft: l + w / 2 }) //中间对中间
              lines.x.push({ left: l - width, showLeft: l }) //底部对顶部
              lines.x.push({ left: l + w - width, showLeft: l + w }) //底部对底部
            })
            return lines
          })()
        }
        document.addEventListener('mousemove', mousemove);
        document.addEventListener('mouseup', mouseup);
      }
      const mousemove = (e: MouseEvent) => {

        if (!dragState.dragging) {
          dragState.dragging = true;
          dragstart.emit()
        }
        let { clientX: moveX, clientY: moveY } = e;
        const { startX, startY } = dragState;
        // let durX = e.clientX - dragState.startX;
        // let durY = e.clientY - dragState.startY;
        if (e.shiftKey) {
          if (Math.abs(moveX - startX) > Math.abs(moveY - startY)) {
            moveY = startY
          } else {

            moveX = startX
          }
        }
        const currentLeft = dragState.startLeft + moveX - startX;
        const currentTop = dragState.startTop + moveY - startY;
        const currentMark = {
          x: null as null | number,
          y: null as null | number
        }
        for (let i = 0; i < dragState.markLines.y.length; i++) {
          const { top, showTop } = dragState.markLines.y[i];
          if (Math.abs(top - currentTop) < 5) {
            moveY = top + startY - dragState.startTop;
            currentMark.y = showTop;
            break;
          }
        }

        for (let i = 0; i < dragState.markLines.x.length; i++) {
          const { left, showLeft } = dragState.markLines.x[i];
          if (Math.abs(left - currentLeft) < 5) {
            moveX = left + startX - dragState.startLeft;
            currentMark.x = showLeft;
            break;
          }
        }
        mark.x = currentMark.x;
        mark.y = currentMark.y;
        const durX = moveX - startX;
        const durY = moveY - startY;
        focusData.value.focus.forEach((block, index) => {
          block.top = dragState.startPos[index].top + durY;
          block.left = dragState.startPos[index].left + durX;
        })
      }
      const mouseup = (e: MouseEvent) => {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
        mark.x = null;
        mark.y = null
        if (dragState.dragging) {
          dragend.emit();
        }
      }
      return { mark, mousedown };
    })()
    const handler = {
      onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData) => {
        if (state.preview) return;
        e.preventDefault();
        e.stopPropagation();
        $$dropdown({
          reference: e,
          content: () => <>
            <DropdownOption label="置顶节点" icon="icon-place-top" {...{ onClick: commander.placeTop }} />
            <DropdownOption label="置底节点" icon="icon-place-bottom" {...{ onClick: commander.placeBottom }} />
            <DropdownOption label="删除节点" icon="icon-delete" {...{ onClick: commander.delete }} />
            <DropdownOption label="查看数据" icon="icon-browse" {...{ onClick: () => methods.showBlockData(block) }} />
            <DropdownOption label="导入节点" icon="icon-import" {...{ onClick: () => methods.importBlockData(block) }} />
          </>
        })
      }
    }
    const commander = useVisualCommand({
      focusData,
      updateBlocks: methods.updateBlocks,
      dataModel,
      dragstart,
      dragend
    });
    const buttons = [
      { label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z' },
      { label: '重做', icon: 'icon-back', handler: commander.redo, tip: 'ctrl+z' },
      {
        label: () => state.preview ? '编辑' : '预览',
        icon: () => state.preview ? 'icon-edit' : 'icon-browse',
        handler: () => {
          if (!state.preview) { methods.clearFocus() }
          state.preview = !state.preview;
        }

      },
      {
        label: '导入', icon: 'icon-import', handler: async () => {
          const text = await $$dialog.textarea()
          try {
            const data = JSON.parse(text || '')
            dataModel.value = data
          } catch (error) {
            console.log(error)
          }

        }, tip: ''
      },
      {
        label: '导出', icon: 'icon-export', handler: () => $$dialog.textarea(JSON.stringify(dataModel.value), {
          editReadonly: true
        })
      },
      { label: '置顶', icon: 'icon-place-top', handler: () => commander.placeTop(), tip: '' },
      { label: '置底', icon: 'icon-place-bottom', handler: () => commander.placeBottom(), tip: '' },
      { label: '删除', icon: 'icon-delete', handler: () => commander.delete(), tip: 'ctrl+d,backspace,delete' },
      { label: '清空', icon: 'icon-reset', handler: () => commander.clear(), tip: '' },
      { label: '关闭', icon: 'icon-close', handler: () => {
        methods.clearFocus()
        state.editing = false
      }, tip: '' },
    ]
    return () => <>
      <div class="visual-editor-container" style={containerStyle.value} v-show={!state.editing}>
        {
          !!dataModel.value && !!dataModel.value.blocks && (dataModel.value.blocks.map((block, index) => (
            <VisualEditorBlock config={props.config} block={block} key={index}
              formData={props.formData}
            />
          ))
          )}
      <div class="visual-editor-container-button" onClick={methods.openEdit}>
        <i class="iconfont icon-edit" />
        <span>编辑组件</span>
      </div>
      </div>


      <div class={classes.value} v-show={state.editing}>
        <div class="visual-editor-menu">
          {props.config.componentList.map(component =>
            <div class="visual-editor-menu-item"
              draggable
              onDragstart={(e) => menuDraggier.dragstart(e, component)}
              onDragend={menuDraggier.dragend}
            >
              <span class="visual-editor-menu-item-label">{component.label}</span>
              {component.preview()}
            </div>
          )}
        </div>
        <div class="visual-editor-head">
          {
            buttons.map((btn, index) => {
              const label = typeof btn.label === 'function' ? btn.label() : btn.label;
              const icon = typeof btn.icon === 'function' ? btn.icon() : btn.icon;
              return (<div key={index} class="visual-editor-head-button" onClick={btn.handler}>
                <i class={`iconfont ${icon}`}></i>
                <span>{label}</span>
              </div>)
            }

            )
          }
        </div>
        <VisualOperatorEditor
          block={state.selectBlock}
          config={props.config}
          dataModel={dataModel}
          updateBlock={commander.updateBlock}
          updateModelValue={commander.updateModelValue}
        />
        <div class="visual-editor-body">
          <div class="visual-editor-content">
            <div class="visual-editor-container" style={containerStyle.value} ref={containerRef} {...focusHandler.container}>
              {
                !!dataModel.value && !!dataModel.value.blocks && (dataModel.value.blocks.map((block, index) => (
                  <VisualEditorBlock config={props.config} block={block} key={index}
                    formData={props.formData}
                    {...{
                      onMousedown: (e: MouseEvent) => focusHandler.block.onMousedown(e, block, index),
                      onContextmenu: (e: MouseEvent) => handler.onContextmenuBlock(e, block)
                    }} />
                ))
                )}
              {
                blcokDraggier.mark.y !== null && (
                  <div class="visual-editor-mark-line-y" style={{ top: `${blcokDraggier.mark.y}px` }} />
                )
              }
              {
                blcokDraggier.mark.x !== null && (
                  <div class="visual-editor-mark-line-x" style={{ left: `${blcokDraggier.mark.x}px` }} />
                )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  }
})