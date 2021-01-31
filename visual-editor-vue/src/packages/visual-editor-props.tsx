export enum VisualEditorPropsType{
    input='input',
    color='color',
    select='select',
    table='table'
}
export type VisualEditorProps={
    type:VisualEditorPropsType,
    label:string
} & {
    options?:VisualEditorSelectOptions,
} & {
    table?:VisualEditorTableOptions
}

export function createEditorInputProp(label:string):VisualEditorProps{
    return{
        type:VisualEditorPropsType.input,
        label,
    }
}


export function createEditorColorProp(label:string):VisualEditorProps{
    return{
        type:VisualEditorPropsType.color,
        label,
    }
}


export type VisualEditorSelectOptions ={
    label:string,
    val:string
}[]
export function createEditorSelectProp(label:string,options:VisualEditorSelectOptions):VisualEditorProps{
    return{
        type:VisualEditorPropsType.select,
        label,
        options
    }
}




export type VisualEditorTableOptions = {
    options:{
        label:string,
        field:string,
    
    }[],
    showKey:string
}
export function createEditorTableProp(label: string, option: VisualEditorTableOptions):VisualEditorProps{
    return {
        type: VisualEditorPropsType.table,
        label,
        table:option
    }
}