import $ from "jquery";

const adminMenu = document.getElementById("admin__menu-items");

if (adminMenu) {
  (() => {
    $(() => {
      // 현재 활성화 된 메뉴 active 처리
      const pathname = window.location.pathname.split("/");
      $("ul#admin__menu-items li").removeClass("active");
      $(`#admin__menu-${pathname[1]}`).addClass("active");
    });
  })();
}
