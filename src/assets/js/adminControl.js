import $ from "jquery";

const adminMenu = document.getElementById("main-menu-navigation");

if (adminMenu) {
  (() => {
    $(() => {
      // 좌측 사이드바 활성화
      const pathname = window.location.pathname.split("/");
      $("ul#main-menu-navigation li.nav-item ul.menu-content li").removeClass("active");
      $(`#admin__menu-${pathname[2]}`).addClass("active");

      // form 제출 시 검증 후 통과 시 submit
      const bootstrapForm = $("form.needs-validation");
      Array.prototype.filter.call(bootstrapForm, (form) => {
        form.addEventListener("submit", () => {
          if (form.checkValidity()) {
            bootstrapForm.trigger("submit");
          }
        });
      });
    });
  })();
}
