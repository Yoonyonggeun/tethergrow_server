import $ from "jquery";

const adminExchangePage = document.getElementById("admin__exchange-page");
const adminEventPage = document.getElementById("admin__event-page");

if (adminExchangePage || adminEventPage) {
  (() => {
    $(() => {
      $("tr.list-group-item").on("drop", () => {
        // 수정하려는 모델명과 해당 모델의 데이터 ID를 배열로 저장
        const modelName = $("tbody.list-group").attr("data-model");
        const dataIDs = [];
        $("tr.list-group-item").each((i, elem) => {
          const dataID = $(elem).attr("data-id");
          dataIDs.push({ id: dataID, order: i + 1 });
          $(elem)
            .find("span.font-weight-bold")
            .text(i + 1);
        });
        // 서버로 데이터 ID 배열을 전송
        $.ajax({
          url: "/api/change-order",
          type: "POST",
          data: { modelName, dataIDs },
          success: (result) => {
            if (result.msg === "success") {
              // 번호 순서 맞춰주기
              $("tr.list-group-item").each((i, elem) => {
                $(elem)
                  .find("span.data-index")
                  .text(i + 1);
              });

              alert("순서가 변경되었습니다.");
            }
          },
          error: (err) => {
            alert(`오류가 발생했습니다:
            ${JSON.stringify(err)}`);
          },
        });
      });
    });
  })();
}
