import { captureDraft } from "../lib/form-draft";
import { expect, it } from "vitest";
import { mergeNotifications } from "../lib/notification-state";
import { planRosterImport } from "../lib/roster-import";
const note = (id: string, read = false) => ({ id, read, type: "chat", title: "Hello", body: null, link: null, createdAt: "2026-09-14T12:00:00Z" });
it("reconciles read updates and overlapping notification pages without duplicates", () => {
  expect(mergeNotifications([note("a"), note("b")], [note("b", true), note("c")])).toEqual([note("c"), note("b", true), note("a")]);
});
it("roster previews preserve omitted fields, existing email casing and membership status", () => {
  const before = { name: "Member", email: "Member@example.test", phone: "555", classification: "Teacher", join_date: "2020-01-01", status: "inactive" as const };
  const [result] = planRosterImport([{ rowNumber: 2, name: "New name", email: "member@example.test", status: "active" }], [before]);
  expect(result.kind).toBe("changed");
  expect(result.changes).toEqual([{ field: "name", before: "Member", after: "New name" }]);
  expect(result.after).toEqual({ ...before, name: "New name" });
});
it("roster previews distinguish additions from unchanged records", () => {
  const before = { name: "Member", email: "m@example.test", phone: null, classification: null, join_date: null, status: "active" as const };
  expect(planRosterImport([{ rowNumber: 2, name: "Member", email: "m@example.test" }, { rowNumber: 3, name: "New", email: "n@example.test" }], [before]).map(row => row.kind)).toEqual(["unchanged", "added"]);
});

it("draft recovery preserves checkbox groups without storing passwords or file fields", () => {
 expect(captureDraft([{name:"categories",type:"checkbox",value:"education",checked:true},{name:"categories",type:"checkbox",value:"health",checked:false},{name:"categories",type:"checkbox",value:"water",checked:true},{name:"password",type:"password",value:"secret"},{name:"token",type:"hidden",value:"secret"},{name:"attachment",type:"file",value:"private.pdf"},{name:"body",type:"textarea",value:"My draft"}])).toEqual({categories:["education","water"],body:"My draft"});
});
