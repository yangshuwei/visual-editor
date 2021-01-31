import { ref, computed, watch, defineComponent } from 'vue';
export function useModel<T>(getter: () => T, emitter: (val: T) => void) {
  const state = ref(getter()) as { value: T };
  watch(getter, val => {
    if (val !== state.value) {
      state.value = val;
    }
  })
  return {
    get value() { return state.value },
    set value(val: T) {
      if (state.value !== val) {
        state.value = val
        emitter(val)
      }
    }
  }
  // return computed({
  //   get: () => state.value,
  //   set: (val: T) => {
  //     if (state.value !== val) {
  //       state.value = val;
  //       emitter(val)
  //     }
  //   }
  // });
}

// export const TestUseModule = defineComponent({
//   props: {
//     moduleValue: { type: String }
//   },
//   // emit: {
//   //   'update:moduleValue': (val?: string) => true
//   // },
//   setup(props, ctx) {
//     // const model = useModule(() => props.moduleValue, (val) => ctx.emit('update:moduleValue', val))
//     return () => (
//       <div>
//         <input type="text" />
//       </div>

//     )
//   },
// })
 