import { useEffect, useState } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  getAllResults,
  createResult,
  publishResult,
  unpublishResult,
  deleteResult,
  clearResultMessage,
} from "../../reducer/slice/lotteryResultReducer";

const Results = () => {
  const dispatch = useDispatch();

  const {
    results,
    loading,
    createLoading,
    publishLoading,
    deleteLoading,
    success,
    error,
    message,
  } = useSelector(
    (state) => state.lotteryResult
  );

  const [showCreate, setShowCreate] =
    useState(false);

  const [formData, setFormData] = useState({
    date: "",
    number: "",
  });

  // ==========================================
  // GET RESULTS
  // ==========================================
  useEffect(() => {
    dispatch(getAllResults());
  }, [dispatch]);

  // ==========================================
  // CLEAR MESSAGE
  // ==========================================
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearResultMessage());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE RESULT
  // ==========================================
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.number) {
      return;
    }

    const result = await dispatch(
      createResult(formData)
    );

    if (
      createResult.fulfilled.match(result)
    ) {
      setFormData({
        date: "",
        number: "",
      });

      setShowCreate(false);

      dispatch(getAllResults());
    }
  };

  // ==========================================
  // PUBLISH
  // ==========================================
  const handlePublish = async (id) => {
    const result = await dispatch(
      publishResult(id)
    );

    if (
      publishResult.fulfilled.match(result)
    ) {
      dispatch(getAllResults());
    }
  };

  // ==========================================
  // UNPUBLISH
  // ==========================================
  const handleUnpublish = async (id) => {
    const result = await dispatch(
      unpublishResult(id)
    );

    if (
      unpublishResult.fulfilled.match(result)
    ) {
      dispatch(getAllResults());
    }
  };

  // ==========================================
  // DELETE
  // ==========================================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this result?"
    );

    if (!confirmed) {
      return;
    }

    await dispatch(deleteResult(id));
  };

  // ==========================================
  // STATUS
  // ==========================================
  const getStatus = (result) => {
    if (
      result?.published === true ||
      result?.isPublished === true
    ) {
      return "Published";
    }

    return "Unpublished";
  };

  return (
    <div className="space-y-6">

      {/* ======================================
          HEADER
      ====================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lottery Results
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage lottery results and publication status.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={() =>
              dispatch(getAllResults())
            }
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCreate(!showCreate)
            }
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {showCreate
              ? "Close"
              : "+ Create Result"}
          </button>

        </div>

      </div>

      {/* ======================================
          SUCCESS MESSAGE
      ====================================== */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      {/* ======================================
          ERROR MESSAGE
      ====================================== */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ======================================
          CREATE FORM
      ====================================== */}
      {showCreate && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Create New Result
          </h2>

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >

            {/* DATE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Result Date
              </label>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* NUMBER */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Result Number
              </label>

              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Enter result number"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* SUBMIT */}
            <div className="md:col-span-2">

              <button
                type="submit"
                disabled={
                  createLoading ||
                  !formData.date ||
                  !formData.number
                }
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {createLoading
                  ? "Creating..."
                  : "Create Result"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* ======================================
          RESULTS TABLE
      ====================================== */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

        {/* TABLE HEADER */}
        <div className="border-b border-slate-200 px-6 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                All Results
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {results?.length || 0} result(s)
              </p>
            </div>

          </div>

        </div>

        {/* LOADING */}
        {loading ? (
          <div className="p-10 text-center">

            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

            <p className="text-sm text-slate-500">
              Loading results...
            </p>

          </div>
        ) : results?.length === 0 ? (
          /* EMPTY */
          <div className="p-10 text-center">

            <div className="mb-3 text-4xl">
              📋
            </div>

            <h3 className="font-semibold text-slate-900">
              No Results Found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first lottery result.
            </p>

          </div>
        ) : (
          /* TABLE */
          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Number
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {results.map(
                  (item, index) => {

                    const published =
                      item?.published === true ||
                      item?.isPublished === true;

                    return (
                      <tr
                        key={item._id || index}
                        className="transition hover:bg-slate-50"
                      >

                        {/* INDEX */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        {/* DATE */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {item?.date
                            ? new Date(
                                item.date
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        {/* NUMBER */}
                        <td className="whitespace-nowrap px-6 py-4">

                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-wider text-slate-900">
                            {item?.number ||
                              item?.result ||
                              "-"}
                          </span>

                        </td>

                        {/* STATUS */}
                        <td className="whitespace-nowrap px-6 py-4">

                          {published ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Published
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                              Unpublished
                            </span>
                          )}

                        </td>

                        {/* CREATED */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {item?.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        {/* ACTIONS */}
                        <td className="whitespace-nowrap px-6 py-4">

                          <div className="flex justify-end gap-2">

                            {published ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUnpublish(
                                    item._id
                                  )
                                }
                                disabled={
                                  publishLoading
                                }
                                className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePublish(
                                    item._id
                                  )
                                }
                                disabled={
                                  publishLoading
                                }
                                className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                              >
                                Publish
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item._id
                                )
                              }
                              disabled={
                                deleteLoading
                              }
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default Results;
