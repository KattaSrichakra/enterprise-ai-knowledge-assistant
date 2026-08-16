"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ApiError,
} from "@/lib/api/client";

import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaces,
  updateWorkspace,
  type Workspace,
} from "@/lib/api/workspaces";

interface WorkspaceFormState {
  name: string;
  description: string;
}

const initialFormState: WorkspaceFormState = {
  name: "",
  description: "",
};

export function WorkspaceManager() {
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] =
    useState<Workspace | null>(null);

  const [form, setForm] =
    useState<WorkspaceFormState>(initialFormState);

  const loadWorkspaces = useCallback(async () => {
  setIsLoading(true);
  setError(null);

  try {
    const data = await getWorkspaces();
    setWorkspaces(data);
  } catch (err) {
    if (err instanceof ApiError) {
      setError(err.message);
    } else {
      setError(
        "Unable to load your workspaces. Please try again.",
      );
    }
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      const data = await getWorkspaces();

      if (!cancelled) {
        setWorkspaces(data);
      }
    } catch (err) {
      if (!cancelled) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(
            "Unable to load your workspaces. Please try again.",
          );
        }
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  void load();

  return () => {
    cancelled = true;
  };
}, []);
  function openCreateModal() {
    setEditingWorkspace(null);
    setForm(initialFormState);
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(workspace: Workspace) {
    setEditingWorkspace(workspace);

    setForm({
      name: workspace.name,
      description: workspace.description ?? "",
    });

    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setEditingWorkspace(null);
    setForm(initialFormState);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Workspace name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingWorkspace) {
        const updatedWorkspace = await updateWorkspace(
          editingWorkspace.id,
          {
            name,
            description: description || null,
          },
        );

        setWorkspaces((current) =>
          current.map((workspace) =>
            workspace.id === updatedWorkspace.id
              ? updatedWorkspace
              : workspace,
          ),
        );
      } else {
        const newWorkspace = await createWorkspace({
          name,
          description: description || null,
        });

        setWorkspaces((current) => [
          newWorkspace,
          ...current,
        ]);
      }

      closeModal();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Unable to save the workspace. Please try again.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(workspace: Workspace) {
    const confirmed = window.confirm(
      `Delete "${workspace.name}"?\n\nThis will also remove the documents belonging to this workspace.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteWorkspace(workspace.id);

      setWorkspaces((current) =>
        current.filter(
          (item) => item.id !== workspace.id,
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Unable to delete the workspace. Please try again.",
        );
      }
    }
  }

  function handleOpenWorkspace(workspaceId: number) {
    router.push(`/documents?workspace_id=${workspaceId}`);
  }

  return (
    <section className="p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Knowledge organization
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Workspaces
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create focused knowledge spaces for your
              documents, sources, and AI conversations.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span className="text-lg leading-none">
              +
            </span>
            New workspace
          </button>
        </div>

        {error && !isModalOpen && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start justify-between gap-4">
              <p>{error}</p>

              <button
                type="button"
                onClick={() => void loadWorkspaces()}
                className="shrink-0 font-semibold text-red-700 underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              ◇
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              Create your first workspace
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              A workspace keeps your documents and
              knowledge context organized in one place.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create workspace
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => (
              <article
                key={workspace.id}
                className="group flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                      {workspace.name
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {workspace.name}
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Workspace #{workspace.id}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-500">
                  {workspace.description ||
                    "No description added yet."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenWorkspace(workspace.id)
                    }
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
                  >
                    Open workspace
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(workspace)
                      }
                      className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleDelete(workspace)
                      }
                      className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="workspace-dialog-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Workspace
                  </p>

                  <h3
                    id="workspace-dialog-title"
                    className="mt-1 text-xl font-semibold text-slate-900"
                  >
                    {editingWorkspace
                      ? "Edit workspace"
                      : "Create workspace"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="workspace-name"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Workspace name
                  </label>

                  <input
                    id="workspace-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Product Documentation"
                    maxLength={255}
                    autoFocus
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="workspace-description"
                    className="text-sm font-semibold text-slate-800"
                  >
                    Description
                    <span className="ml-1 font-normal text-slate-400">
                      optional
                    </span>
                  </label>

                  <textarea
                    id="workspace-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                    placeholder="What kind of information belongs here?"
                    maxLength={2000}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSaving}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving
                      ? "Saving..."
                      : editingWorkspace
                        ? "Save changes"
                        : "Create workspace"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}