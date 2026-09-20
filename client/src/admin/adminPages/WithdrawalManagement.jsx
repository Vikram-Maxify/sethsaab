import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAllWithdrawals,
    updateWithdrawalStatus,
} from "../../reducer/slice/withdrawalSlice";

const WithdrawalManagement = () => {
    const dispatch = useDispatch();
    const { allWithdrawals } = useSelector((s) => s.withdrawal);

    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);
    const [remark, setRemark] = useState("");
    const [txnId, setTxnId] = useState("");

    useEffect(() => {
        dispatch(fetchAllWithdrawals({ status: filter }));
    }, [dispatch, filter]);

    const openModal = (w, action) => {
        setSelected({ ...w, action });
        setRemark("");
        setTxnId("");
    };

    const handleConfirm = () => {
        dispatch(
            updateWithdrawalStatus({
                id: selected._id,
                status: selected.action,
                adminRemark: remark,
                transactionId: selected.action === "approved" ? txnId : "",
            })
        ).then(() => {
            setSelected(null);
            dispatch(fetchAllWithdrawals({ status: filter }));
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Withdrawal Requests</h2>

            <div className="mb-4 flex gap-2">
                {["pending", "approved", "rejected", ""].map((s) => (
                    <button
                        key={s || "all"}
                        onClick={() => setFilter(s)}
                        className={`px-3 py-1 rounded capitalize ${
                            filter === s ? "bg-blue-600 text-white" : "bg-gray-200"
                        }`}
                    >
                        {s || "all"}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">User</th>
                            <th className="p-2 text-left">Amount</th>
                            <th className="p-2 text-left">Bank Details</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allWithdrawals.map((w) => (
                            <tr key={w._id} className="border-b">
                                <td className="p-2">
                                    <div className="font-semibold">{w.user?.name}</div>
                                    <div className="text-xs text-gray-500">{w.user?.mobile}</div>
                                </td>
                                <td className="p-2 font-bold">₹ {w.amount}</td>
                                <td className="p-2 text-xs">
                                    <div>{w.bankDetail?.bankName}</div>
                                    <div>A/C: {w.bankDetail?.accountNumber}</div>
                                    <div>IFSC: {w.bankDetail?.ifscCode}</div>
                                    <div>Holder: {w.bankDetail?.accountHolderName}</div>
                                    {w.bankDetail?.upiId && (
                                        <div>UPI: {w.bankDetail.upiId}</div>
                                    )}
                                </td>
                                <td className="p-2 capitalize">{w.status}</td>
                                <td className="p-2 text-xs">
                                    {new Date(w.createdAt).toLocaleString()}
                                </td>
                                <td className="p-2">
                                    {w.status === "pending" ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openModal(w, "approved")}
                                                className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => openModal(w, "rejected")}
                                                className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-500">
                                            {w.adminRemark || "-"}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {allWithdrawals.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    No records found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="text-lg font-bold mb-2 capitalize">
                            {selected.action} Withdrawal
                        </h3>
                        <p className="text-sm mb-3">
                            Amount: <b>₹ {selected.amount}</b>
                        </p>

                        {selected.action === "approved" && (
                            <input
                                placeholder="Transaction ID / UTR"
                                value={txnId}
                                onChange={(e) => setTxnId(e.target.value)}
                                className="input w-full mb-2"
                            />
                        )}

                        <textarea
                            placeholder="Remark (optional)"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            className="input w-full mb-3"
                            rows={3}
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-3 py-1 bg-gray-300 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-3 py-1 text-white rounded ${
                                    selected.action === "approved"
                                        ? "bg-green-600"
                                        : "bg-red-600"
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalManagement;