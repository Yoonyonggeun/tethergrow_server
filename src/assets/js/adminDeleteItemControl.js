import $ from "jquery";
import routes from "../../routes";

const adminNormalUserPage = document.getElementById("admin__normalUser-page");
const adminNoticePage = document.getElementById("admin__notice-page");
const adminEventPage = document.getElementById("admin__event-page");

if (adminNormalUserPage || adminNoticePage || adminEventPage) {
  (() => {
    $(() => {
      // 전체 선택 체크박스 클릭 시
      $("#checkAll").on("click", function () {
        $("input[type='checkbox']").prop("checked", this.checked);
      });

      // 선택 삭제 버튼 클릭 시
      $("#select__delete-btn").on("click", function () {
        const modelName = $(this).data("db");
        const checkItems = $("input[type='checkbox']:checked")
          .map((index, item) => $(item).data("id"))
          .get();
        if (checkItems.length === 0) {
          alert("삭제할 항목을 선택해주세요.");
          return;
        }
        const isConfirm = confirm("정말로 삭제하시겠습니까?");
        if (!isConfirm) return;
        $.ajax({
          url: `${routes.adminApi}/select-delete-item`,
          type: "POST",
          data: { modelName, checkItems },
          success: (result) => {
            if (result.msg === "success") {
              alert("삭제되었습니다.");
              window.location.reload();
            }
          },
          error: (err) => {
            alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
          },
        });
      });

      // 전체 삭제 버튼 클릭 시
      $("#all__delete-btn").on("click", function () {
        const isConfirm = confirm("정말로 삭제하시겠습니까?");
        if (!isConfirm) return;
        const modelName = $(this).data("db");
        $.ajax({
          url: `${routes.adminApi}/all-delete-item`,
          type: "POST",
          data: { modelName },
          success: (result) => {
            if (result.msg === "success") {
              alert("삭제되었습니다.");
              window.location.reload();
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
