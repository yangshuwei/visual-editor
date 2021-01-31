
import { onUnmounted, reactive } from 'vue';
import { KeyboardCode } from './keyboard-code';

export interface CommandExecute {
  undo?: () => void,
  redo: () => void,
}
export interface Command {
  name: string, //命令唯一标识
  keyboard?: string | string[], //命令快捷键
  execute: (...args: any[]) => CommandExecute, //执行命令函数
  followQueue?: boolean,//执行完毕后是否将undo，redo存到队列
  init?:()=>((()=>void)|undefined),
  data?:any
}

export function useCommander() {
  let state = reactive({
    current: -1, //队列中当前命令
    queue: [] as CommandExecute[],//命令队列
    commandArray:[] as Command[], //，命令对象数组
    commands: {} as Record<string, (...args: any[]) => void>, //key是字符串，值是Command对象，命令对象通过命令名称调用excute函数
    destroyList: [] as ((()=>void) |undefined)[],//组件销毁数组
  })
  const registry = (command: Command) => {
    state.commandArray.push(command);
    state.commands[command.name] = (...args) => {
      const { undo, redo,} = command.execute(...args);
      redo()

      //命令执行后，直接返回。不需要进入命令队列
      if(command.followQueue==false){
        return
      }
     //去除命令队列中剩余，保留当前命令 
      let {queue,current} = state;
      if(queue.length>0){
        queue = queue.slice(0,current+1);
        state.queue = queue;
      }
      queue.push({undo,redo});
      state.current = current+1
    }

  }

  const keyboardEvent = (()=>{
    const onKeydown = (e:KeyboardEvent)=>{
      console.log(e)
      if(document.activeElement !== document.body) return;
      const {keyCode ,shiftKey,altKey,ctrlKey,metaKey} = e;
      let keyString:string[] = [];
      if(ctrlKey||metaKey) keyString.push('ctrl');
      if(shiftKey) keyString.push('shift');
      if (altKey) keyString.push('alt');
      keyString.push(KeyboardCode[keyCode]);
      const keyName  = keyString.join('+')
      state.commandArray.forEach(({keyboard,name:string})=>{
        if(!keyboard) return
        const keys = Array.isArray(keyboard)?keyboard:[keyboard];
        if (keys.indexOf(keyName)>-1){
          state.commands[name]();
          e.stopPropagation();
          e.preventDefault();
        }
      })
    }
    const init =()=>{
      window.addEventListener('keydown',onKeydown)
      return () => window.removeEventListener('keydown', onKeydown);
    }
    return init
  })();


  const init = ()=>{
    const onKeydown = (e:KeyboardEvent)=>{

    } 
    window.addEventListener('keydown',onKeydown);

    state.commandArray.forEach(command=>!!command.init && state.destroyList.push(command.init()))
    state.destroyList.push(keyboardEvent())
    state.destroyList.push(()=>window.removeEventListener('keydown',onKeydown))
  }

  const destroy = () =>{}
  registry({
    name: 'undo',
    keyboard: 'ctrl+z',
    followQueue: false,
    execute: () => {
      return {
        redo: () => { //重做
          if(state.current === -1){
            return;
          }
          const queueItem = state.queue[state.current];
          if(!!queueItem){
            !!queueItem.undo && queueItem.undo();
            state.current--;
          }
          // let { current } = state;
          // if (current === -1) return;
          // const { undo } = state.queue[current];
          // !!undo && undo();
          // state.current --;
        },
      }
    }
  })

  registry({
    name:'redo',
    keyboard:[
      'ctrl+y',
      'ctrl+shift+z'
    ],
    followQueue:false,
    execute:()=>{
      return {
        redo:()=>{
          const queueItem = state.queue[state.current +1];
          if(!!queueItem){
            queueItem.redo();
            state.current++;
          }
          // let {current} = state;
          // if(!state.queue[current]) return;
          // const {redo} = state.queue[current+1];
          // redo();
          // state.current++;
        }
      }
    }
  })
  onUnmounted(()=>state.destroyList.forEach(fn=>!!fn && fn()));
  return {
    state,
    registry,
    init
  }
}



export interface CommandManager {
  queue: CommandExecute[],
  current: number
}