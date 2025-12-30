import $ from "jquery";
import routes from "../../routes";

const adminExchangeFormPage = document.getElementById("admin__exchangeForm-page");

if (adminExchangeFormPage) {
  (() => {
    $(() => {
      // 거래소 로고 이미지 미리보기
      $("#logo-img").on("change", function () {
        const file = this.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("previewImg", file);
          $.ajax({
            url: `${routes.adminApi}/upload-preview-img`,
            type: "POST",
            enctype: "multipart/form-data",
            data: formData,
            processData: false,
            contentType: false,
            success: (result) => {
              if (result.msg === "success") {
                $("#preview__logo-img img").attr("src", result.file.location);
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        } else {
          const oldImg = $("#preview__logo-img").data("img");
          $("#preview__logo-img img").attr("src", oldImg);
        }
      });

      // 썸네일 이미지 미리보기
      $("#thumbnail-img").on("change", function () {
        const file = this.files[0];
        if (file) {
          const formData = new FormData();
          formData.append("previewImg", file);
          $.ajax({
            url: `${routes.adminApi}/upload-preview-img`,
            type: "POST",
            enctype: "multipart/form-data",
            data: formData,
            processData: false,
            contentType: false,
            success: (result) => {
              if (result.msg === "success") {
                $("#preview__thumbnail-img img").attr("src", result.file.location);
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        } else {
          const oldImg = $("#preview__thumbnail-img").data("img");
          $("#preview__thumbnail-img img").attr("src", oldImg);
        }
      });
    });
  })();
}
