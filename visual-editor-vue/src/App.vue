<template>
  <div>
    hello
    <visual-editor
      v-model="jsonData"
      :config="visualConfig"
      :formData="formData"
    />
    <div style="text-align:center">
      {{
        JSON.stringify(formData)
      }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { VisualEditor } from "./packages/visual-editor";
import { visualConfig } from "./visual.config";
// import {TestUseModule} from './packages/utils/useModule';
export default defineComponent({
  name: "App",
  components: {
    VisualEditor,
    // TestUseModule
  },
  data() {
    return {
      visualConfig,
      jsonData: {
        container: { heigth: 500, width: 800 },
        blocks: [
          {
            top: 92,
            left: 211,
            componentKey: "text",
            adjustPosition: true,
            focus: false,
            zIndex: 0,
            width: 64,
            height: 21,
            hasResize: false,
            props: {},
            model: {},
          },
          {
            top: 57,
            left: 500.5,
            componentKey: "button",
            adjustPosition: true,
            focus: true,
            zIndex: 0,
            width: 70,
            height: 40,
            hasResize: false,
            props: {},
            model: {},
          },
          {
            top: 208,
            left: 427,
            componentKey: "select",
            adjustPosition: true,
            focus: false,
            zIndex: 0,
            width: 217,
            height: 40,
            hasResize: false,
            props: {},
            model: {},
          },
          {
            top: 326,
            left: 582,
            componentKey: "input",
            adjustPosition: true,
            focus: false,
            zIndex: 0,
            width: 202,
            height: 40,
            hasResize: false,
            props: {},
            model: {},
          },
        ],
      },
      formData: {
        username: "admin",
      },
    };
  },
});
</script>
<style>
  .app{
    padding-bottom: 200px;
  }
</style>


