import $ from "jquery";
// import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
// import Underline from "@ckeditor/ckeditor5-basic-styles/src/underline";
// import Strikethrough from "@ckeditor/ckeditor5-basic-styles/src/strikethrough";
// import Code from "@ckeditor/ckeditor5-basic-styles/src/code";
// import Subscript from "@ckeditor/ckeditor5-basic-styles/src/subscript";
// import Superscript from "@ckeditor/ckeditor5-basic-styles/src/superscript";

const ckeditor = document.getElementById("ckeditor");

const init = () => {
  $(() => {
    // 코드 작성
    // ClassicEditor.create(document.querySelector("#desc2"), {
    //   toolbar: {
    //     items: ["heading", "|", "bold", "italic", "underline", "strikethrough", "code", "subscript", "superscript"],
    //   },
    // }).catch((error) => {
    //   console.error(error);
    // });

    console.log("hi");
  });
};

if (ckeditor) {
  init();
}
