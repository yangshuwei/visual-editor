import { defer } from "@/packages/utils/defer";
import { VisualEditorProps } from "@/packages/visual-editor-props";
import deepcopy from "deepcopy";
import { ElButton, ElDialog, ElInput, ElTable, ElTableColumn } from "element-plus";
import { createApp, defineComponent, getCurrentInstance, onMounted, PropType, reactive } from "vue";

export interface TablePropEditorServiceOption {
    data: any[],
    config: VisualEditorProps,
    onConfirm: (val: any[]) => void
}

const ServiceComponent = defineComponent({
    props: {
        option: { type: Object as PropType<TablePropEditorServiceOption>, required: true }
    },
    setup(props) {
        const ctx = getCurrentInstance()!;
        const state = reactive({
            option: props.option,
            showFlag: false,
            mounted: (() => {
                const dfd = defer();
                onMounted(dfd.resolve)
                return dfd.promise
            })(),
            editData: [] as any[],
        })
        const methods = {
            service: (option: TablePropEditorServiceOption) => {
                state.option = option;
                state.editData = deepcopy(option.data || [])
                methods.show();
                console.log(state)
            },
            show: async () => {
                // await state.mounted;
                state.showFlag = true;
            },
            hide: () => {
                state.showFlag = false;
            },
            add:()=>{
                state.editData.push({})
            },
            reset:()=>{
                state.editData = deepcopy(state.option.data)
            },
            
        }
        const handler = {
            onConfirm:()=>{
                state.option.onConfirm(state.editData)
                methods.hide();
            },
            onCancel:()=>{
                methods.hide();
            }
        }
        Object.assign(ctx.proxy!, methods);
        // @ts-ignore
        return () => <ElDialog v-model={state.showFlag}>
            {{
                default: () => (
                    <div>
                        <div>
                            <ElButton {...{onClick:methods.add} as any}>添加</ElButton>
                            <ElButton {...{onClick:methods.reset} as any}>重置</ElButton>
                            </div>
                        <ElTable data={state.editData}>
                            <ElTableColumn {...{ type: 'index' } as any} />
                            {state.option.config.table!.options.map((item, index) => (
                                <ElTableColumn {...{ label: item.label } as any}>
                                    {{
                                        default: ({ row }: { row: any }) => <ElInput v-model={row[item.field]} />
                                    }}
                                </ElTableColumn>
                            ))}
                            <ElTableColumn {...{ label: '操作栏' } as any}>
                                <ElButton type="danger">删除</ElButton>
                            </ElTableColumn>
                        </ElTable>
                    </div>
                ),
                footer: () => <>
                    <ElButton {...{onClick:handler.onCancel} as any}>取消</ElButton>
                    <ElButton {...{onClick:handler.onConfirm} as any}type="primary">确定</ElButton>
                </>
            }}
        </ElDialog>
    }
})

export const $$tablePropEditor = (() => {
    let ins: any;
    return (option: Omit<TablePropEditorServiceOption, 'onConfirm'>) => {
        console.log(option)
        if (!ins) {
            const el = document.createElement('div');
            document.body.appendChild(el)
            const app = createApp(ServiceComponent, { option });
            ins = app.mount(el);
        }
        const dfd = defer<any[]>();
        ins.service({
            ...option,
            onConfirm: dfd.resolve
        });
        return dfd.promise
    }
})();