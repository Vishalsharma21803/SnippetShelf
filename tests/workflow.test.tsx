import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import App from "../src/App";
import { AppProvider } from "../src/context/AppContext";
import { repository } from "../src/lib/repository";

beforeEach(async () => {
  cleanup();
  await repository.resetToSeedData();
});
describe("Library workflow", () => {
  it("creates, searches, edits, and deletes a snippet", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("Debounce a callback");
    fireEvent.click(screen.getByRole("button", { name: /New snippet/ }));
    const dialog = screen.getByRole("dialog", { name: "Create snippet" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create snippet" }),
    );
    expect(
      within(dialog).getByText("Code cannot be empty."),
    ).toBeInTheDocument();
    fireEvent.change(
      within(dialog).getByPlaceholderText("e.g. Debounce a callback"),
      { target: { value: "Unique project helper" } },
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText("What problem does this solve?"),
      { target: { value: "A useful helper for this project." } },
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText("Paste or type code here..."),
      { target: { value: "export const answer = 42;" } },
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create snippet" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search snippets" }), {
      target: { value: "Unique project helper" },
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "Unique project helper" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit snippet" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Debounce a callback"), {
      target: { value: "Unique project helper updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Unique project helper updated",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete snippet" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", {
          name: "Unique project helper updated",
        }),
      ).not.toBeInTheDocument(),
    );
    expect(
      (await repository.listSnippets()).some((item) =>
        item.title.includes("Unique project"),
      ),
    ).toBe(false);
  });
  it("keeps a dirty draft on canceled Escape and opens palette commands with keyboard", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );
    await screen.findByText("Debounce a callback");
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const command = screen.getByRole("textbox", { name: "Find command" });
    fireEvent.change(command, { target: { value: "Create" } });
    fireEvent.keyDown(command, { key: "Enter" });
    const title = screen.getByPlaceholderText("e.g. Debounce a callback");
    fireEvent.change(title, { target: { value: "Unsaved idea" } });
    fireEvent.keyDown(title, { key: "Escape" });
    expect(confirm).toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Create snippet" }),
    ).toBeInTheDocument();
    expect(title).toHaveValue("Unsaved idea");
    confirm.mockReturnValue(true);
    fireEvent.keyDown(title, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
