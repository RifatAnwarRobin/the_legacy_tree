(function () {
    "use strict";

    function deathRows() {
        return ["death_date", "death_place"]
            .map(function (name) { return document.querySelector(".field-" + name); })
            .filter(Boolean);
    }

    function applyVisibility(living) {
        var show = !living.checked; // deceased -> show death fields
        deathRows().forEach(function (row) { row.style.display = show ? "" : "none"; });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var living = document.getElementById("id_is_living");
        if (!living) { return; }

        living.addEventListener("change", function () {
            if (living.checked) {
                ["id_death_date", "id_death_place"].forEach(function (id) {
                    var field = document.getElementById(id);
                    if (field) { field.value = ""; }
                });
            }
            applyVisibility(living);
        });

        applyVisibility(living);
    });
})();