import $ from "jquery";

const adminIntegrationPage = document.getElementById("admin__integration-page");

if (adminIntegrationPage) {
  (() => {
    $(() => {
      // UID 연동 신청 승인/거절
      $("button.status__process-btn").each((i, elem) => {
        $(elem).on("click", function () {
          const dataID = $(this).attr("data-id");
          const status = $(this).attr("data-status");
          const isConfirm = confirm(`해당 UID 연동 신청을 ${status === "approved" ? "승인" : "거절"}하시겠습니까?`);
          if (!isConfirm) return;
          $.ajax({
            url: "/api/change-integration-status",
            type: "POST",
            data: { dataID, status },
            success: (result) => {
              if (result.msg === "success") {
                window.location.reload();
              }
            },
            error: (err) => {
              alert(`오류가 발생했습니다:\r\n${JSON.stringify(err)}`);
            },
          });
        });
      });
    });
  })();
}
