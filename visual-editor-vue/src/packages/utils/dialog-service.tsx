import { createApp, defineComponent, getCurrentInstance, PropType, reactive } from 'vue';
import { defer } from './defer';
import { ElInput, ElButton, ElDialog } from 'element-plus'

enum DialogServiceEditType {
  textarea = 'textarea',
  input = 'input'
}

interface DialogServiceOption {
  title?: string,
  editType: DialogServiceEditType,
  editReadonly?: boolean,
  editValue?: string | null,
  onConfirm: (val?: string | null) => void
}
const keyGenerator = (() => {
  let count = 0;
  return () => `auto_key_${count++}`
})()

const ServiceComponent = defineComponent({
  props: {
    option: { type: Object as PropType<DialogServiceOption>, reuqired: true }
  },
  setup(props) {
    const state = reactive({
      option: props.option,
      editValue: null as undefined | null | string,
      showFlag: false,
      key: keyGenerator()

    })
    const ctx = getCurrentInstance();
    const methods = {
      service: (option: DialogServiceOption) => {
        state.option = option,
          state.editValue = option.editValue;
        state.key = keyGenerator()
        methods.show()
      },
      show: () => {
        state.showFlag = true;
      },
      hide: () => {
        state.showFlag = false;
      }
    }
    const handler = {
      onComfirm: () => {
        state.option?.onConfirm(state.editValue);
        methods.hide()
      },
      onCancel: () => {
        methods.hide();
      }
    }
    Object.assign(ctx?.proxy, methods);
    return () => (
      // @ts-ignore
      <ElDialog v-model={state.showFlag} key={state.key}>
        {{
          default: () => (<div>
            {state.option?.editType === DialogServiceEditType.textarea ? (
              <ElInput type="textarea" {...{ row: 10 }} v-model={state.editValue} />
            ) : (<ElInput v-model={state.editValue} />)
            }
          </div>),
          footer: () => (
            <div>
              <ElButton {...{ onClick: handler.onCancel } as any}>取消</ElButton>
              <ElButton {...{ onClick: handler.onComfirm } as any}>确定</ElButton>
            </div>
          )
        }}
      </ElDialog>
    )
  }
})
const DialogService = (() => {
  let ins: any;
  return (option: DialogServiceOption) => {
    if (!ins) {
      const el = document.createElement('div')
      document.body.appendChild(el);
      const app = createApp(ServiceComponent, { option })
      ins = app.mount(el)
    }
    ins.service(option)
  }
})();
export const $$dialog = Object.assign(DialogService, {
  input: (initValue?: string, option?: Omit<DialogServiceOption, 'editType' | 'onConfirm'>) => {
    const dfd = defer<string | null | undefined>();
    const opt: DialogServiceOption = { ...option, editType: DialogServiceEditType.input, onConfirm: dfd.resolve,editValue:initValue };
    DialogService(opt)
    return dfd.promise
  },
  textarea: (initValue?: string, option?: Omit<DialogServiceOption, 'editType' | 'onConfirm'>) => {
    const dfd = defer<string | null | undefined>();
    const opt: DialogServiceOption = { ...option, editType: DialogServiceEditType.textarea, onConfirm: dfd.resolve, editValue: initValue };
    DialogService(opt)
    return dfd.promise
  }

})