import $ from "jquery";
import routes from "../../routes";

const adminNormalUserDetailPage = document.getElementById("admin__normalUserDetail-page");

if (adminNormalUserDetailPage) {
  (() => {
    $(() => {
      // 비밀번호 재설정 버튼 클릭 시
      $("#reset__password-btn").on("click", function () {
        const isConfirm = confirm("비밀번호를 재설정하시겠습니까?");
        if (!isConfirm) return;
        const dataId = $(this).attr("data-id");
        $.ajax({
          url: `${routes.adminApi}/reset-password`,
          type: "POST",
          data: { dataId },
          success: (result) => {
            if (result.msg === "success") {
              alert("비밀번호가 재설정 되었습니다.\r\n아래 비밀번호를 확인해주세요.");
              $("#reset__password-title").css("display", "block");
              $("#reset__password-text").text(result.newPassword);
            }
          },
          error: (err) => {
            alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
          },
        });
      });
    });
  })();
}
