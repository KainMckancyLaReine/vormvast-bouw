"use strict";
const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const mobile = matchMedia("(max-width: 760px)");
if (menu && nav) {
    const setMenu = (expanded) => {
        menu.hidden = !mobile.matches;
        menu.setAttribute("aria-expanded", String(mobile.matches && expanded));
        nav.toggleAttribute("data-collapsed", mobile.matches && !expanded);
    };
    setMenu(false);
    mobile.addEventListener("change", () => setMenu(false));
    menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a"))
            setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
            setMenu(false);
            menu.focus();
        }
    });
}
const service = document.querySelector("#dienst");
if (service) {
    document.querySelectorAll("a[data-service]").forEach((link) => {
        link.addEventListener("click", () => {
            service.value = link.dataset.service ?? "";
        });
    });
}
const form = document.querySelector("#aanvraag");
const formStatus = document.querySelector("#formulier-status");
if (form && formStatus) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const fields = new FormData(form);
        const name = String(fields.get("naam") ?? "").trim();
        const email = String(fields.get("email") ?? "").trim();
        const service = String(fields.get("dienst") ?? "");
        const description = String(fields.get("omschrijving") ?? "").trim();
        if (!name || !description) {
            formStatus.textContent = "Vul uw naam en een beschrijving van uw bouwplan in.";
            form.querySelector(name ? "textarea" : "[name=naam]")?.focus();
            return;
        }
        const text = ["Bouwaanvraag", "", "Naam: " + name, "E-mail: " + email,
            "Dienst: " + service, "", description].join("\n");
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
        const download = document.createElement("a");
        download.href = url;
        download.download = "bouwaanvraag.txt";
        document.body.append(download);
        download.click();
        download.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        formStatus.textContent = "Uw aanvraag is klaar om te delen. Controleer uw downloads.";
    });
}
