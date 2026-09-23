import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  Filter,
  Hash,
  Loader2,
  RefreshCcw,
  Search,
  Wallet,
  X,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getMyDeposits,
  DEPOSIT_STATUS,
  setDepositFilters,
  resetDepositFilters,
} from "../reducer/slice/depositSlice";

// ==========================================================
// EMPTY FILTERS
// ==========================================================

const EMPTY_FILTERS = {
  status: "",
  paymentMethod: "",
  channel: "",
  phone: "",
  username: "",
  orderId: "",
  transactionId: "",
  utr: "",
  fromDate: "",
  toDate: "",
  minAmount: "",
  maxAmount: "",
  sort: "desc",
};

// ==========================================================
// DEPOSIT PAGE
// ==========================================================

const Deposit = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ========================================================
  // REDUX STATE
  // ========================================================

  const {
    deposits = [],
    pagination = {
      total: 0,
      currentPage: 1,
      totalPages: 0,
      limit: 10,
    },
    loading = false,
    error = null,
  } = useSelector((state) => state.deposit || {});

  // ========================================================
  // LOCAL FILTERS
  // ========================================================

  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [showFilters, setShowFilters] = useState(false);

  // ========================================================
  // FETCH DEPOSITS
  // ========================================================

  const loadDeposits = (
    page = 1,
    customFilters = filters
  ) => {
    dispatch(
      getMyDeposits({
        ...customFilters,
        page,
        limit: 10,
      })
    );
  };

  // ========================================================
  // FIRST LOAD
  // ========================================================

  useEffect(() => {
    loadDeposits(1, EMPTY_FILTERS);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // INPUT CHANGE
  // ========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ========================================================
  // SEARCH
  // ========================================================

  const handleSearch = (event) => {
    event.preventDefault();

    dispatch(setDepositFilters(filters));

    loadDeposits(1, filters);
  };

  // ========================================================
  // RESET
  // ========================================================

  const handleReset = () => {
    const resetFilters = {
      ...EMPTY_FILTERS,
    };

    setFilters(resetFilters);

    dispatch(resetDepositFilters());

    loadDeposits(1, resetFilters);
  };

  // ========================================================
  // REFRESH
  // ========================================================

  const handleRefresh = () => {
    loadDeposits(
      pagination.currentPage || 1,
      filters
    );
  };

  // ========================================================
  // PAGINATION
  // ========================================================

  const handlePageChange = (page) => {
    if (loading) return;

    if (page < 1) return;

    if (
      pagination.totalPages > 0 &&
      page > pagination.totalPages
    ) {
      return;
    }

    loadDeposits(page, filters);
  };

  // ========================================================
  // STATUS INFO
  // ========================================================

  const getStatusInfo = (status) => {
    const statusName =
      DEPOSIT_STATUS[Number(status)] ||
      "UNKNOWN";

    switch (statusName) {
      case "SUCCESS":
        return {
          label: "सफल",
          icon: CircleCheck,
          wrapper:
            "border-green-500/30 bg-green-500/10",
          text: "text-green-400",
          dot: "bg-green-400",
        };

      case "FAILED":
        return {
          label: "असफल",
          icon: CircleX,
          wrapper:
            "border-red-500/30 bg-red-500/10",
          text: "text-red-400",
          dot: "bg-red-400",
        };

      case "CANCELLED":
        return {
          label: "रद्द",
          icon: X,
          wrapper:
            "border-gray-500/30 bg-gray-500/10",
          text: "text-gray-400",
          dot: "bg-gray-400",
        };

      case "PENDING":
      default:
        return {
          label: "प्रतीक्षारत",
          icon: Clock3,
          wrapper:
            "border-yellow-500/30 bg-yellow-500/10",
          text: "text-yellow-400",
          dot: "bg-yellow-400",
        };
    }
  };

  // ========================================================
  // STATUS BADGE
  // ========================================================

  const getStatusBadge = (status) => {
    const info = getStatusInfo(status);

    const Icon = info.icon;

    return (
      <span
        className={`
          inline-flex
          items-center
          gap-1.5
          px-3
          py-1.5
          rounded-full
          border
          text-[11px]
          font-bold
          tracking-wide
          ${info.wrapper}
          ${info.text}
        `}
      >
        <Icon size={13} />
        {info.label}
      </span>
    );
  };

  // ========================================================
  // DATE FORMAT
  // ========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ========================================================
  // AMOUNT FORMAT
  // ========================================================

  const formatAmount = (amount) => {
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return "₹0";
    }

    const number = Number(amount);

    if (Number.isNaN(number)) {
      return `₹${amount}`;
    }

    return `₹${number.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // ========================================================
  // PAGE NUMBERS
  // ========================================================

  const getPageNumbers = () => {
    const totalPages =
      pagination.totalPages || 0;

    const currentPage =
      pagination.currentPage || 1;

    if (totalPages <= 1) {
      return [];
    }

    const pages = [];

    const start = Math.max(
      1,
      currentPage - 2
    );

    const end = Math.min(
      totalPages,
      currentPage + 2
    );

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // ========================================================
  // SUMMARY VALUES
  // ========================================================

  const totalDeposits =
    pagination?.total || 0;

  const currentPage =
    pagination?.currentPage || 1;

  const totalPages =
    pagination?.totalPages || 0;

  // ========================================================
  // RETURN
  // ========================================================

  return (
    <div className="min-h-screen bg-[#050505] text-white px-4 sm:px-5 pt-3 pb-8">

      <div className="max-w-5xl mx-auto">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            relative
            overflow-hidden
            rounded-[22px]
            border
            border-[#8d6b20]
            px-4
            py-4
            sm:px-5
          "
          style={{
            background:
              "radial-gradient(circle at 75% 0%, rgba(150,105,20,0.30) 0%, rgba(30,24,10,0.72) 35%, #080808 75%)",

            boxShadow:
              "0 0 35px rgba(245,197,66,0.08)",
          }}
        >

          {/* GOLD GLOW */}

          <div
            className="
              absolute
              right-[-70px]
              top-[-80px]
              w-[190px]
              h-[190px]
              rounded-full
              bg-[#f5c542]/10
              blur-3xl
              pointer-events-none
            "
          />

          <div className="relative flex items-center gap-3">

            {/* BACK BUTTON */}

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="
                w-11
                h-11
                rounded-full
                border
                border-[#80631f]
                bg-black/50
                flex
                items-center
                justify-center
                text-[#f5c542]
                active:scale-95
                transition
                flex-shrink-0
              "
            >
              <ArrowLeft size={21} />
            </button>

            {/* ICON */}

            <div
              className="
                w-12
                h-12
                rounded-full
                border
                border-[#80631f]
                bg-black/50
                flex
                items-center
                justify-center
                flex-shrink-0
              "
            >
              <Wallet
                size={25}
                className="text-[#f5c542]"
              />
            </div>

            {/* TITLE */}

            <div className="flex-1 min-w-0">

              <p className="text-[#bcbcbc] text-xs sm:text-sm">
                मेरा खाता
              </p>

              <h1 className="text-white text-xl sm:text-2xl font-extrabold truncate">
                डिपॉजिट इतिहास
              </h1>

              <p className="text-[#8e8e8e] text-xs sm:text-sm mt-0.5">
                अपने सभी डिपॉजिट देखें
              </p>

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="
                w-11
                h-11
                rounded-full
                border
                border-[#80631f]
                bg-black/50
                flex
                items-center
                justify-center
                text-[#f5c542]
                active:scale-95
                transition
                disabled:opacity-40
                flex-shrink-0
              "
            >
              {loading ? (
                <Loader2
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <RefreshCcw size={19} />
              )}
            </button>

          </div>

        </div>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="grid grid-cols-2 gap-3 mt-4">

          {/* TOTAL */}

          <div
            className="
              rounded-[18px]
              border
              border-[#80631f]
              px-4
              py-4
            "
            style={{
              background:
                "linear-gradient(110deg, #17130a 0%, #0b0b0b 65%)",
            }}
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <Wallet
                  size={22}
                  className="text-[#f5c542]"
                />
              </div>

              <div className="min-w-0">

                <p className="text-[#9e9e9e] text-xs">
                  कुल डिपॉजिट
                </p>

                <p className="text-white text-xl sm:text-2xl font-extrabold mt-0.5">
                  {totalDeposits}
                </p>

              </div>

            </div>

          </div>

          {/* PAGE */}

          <div
            className="
              rounded-[18px]
              border
              border-[#80631f]
              px-4
              py-4
            "
            style={{
              background:
                "linear-gradient(110deg, #17130a 0%, #0b0b0b 65%)",
            }}
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <Hash
                  size={22}
                  className="text-[#f5c542]"
                />
              </div>

              <div className="min-w-0">

                <p className="text-[#9e9e9e] text-xs">
                  पेज
                </p>

                <p className="text-[#f5c542] text-xl sm:text-2xl font-extrabold mt-0.5">
                  {currentPage}
                  <span className="text-[#777] text-sm ml-1">
                    / {totalPages || 0}
                  </span>
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="
              mt-4
              rounded-[18px]
              border
              border-red-500/30
              bg-red-500/10
              px-4
              py-3
              flex
              items-start
              gap-3
            "
          >

            <CircleX
              size={20}
              className="text-red-400 mt-0.5 flex-shrink-0"
            />

            <p className="text-red-400 text-sm">
              {error}
            </p>

          </div>
        )}

        {/* ==================================================
            FILTER HEADER
        ================================================== */}

        <div className="mt-4">

          <button
            type="button"
            onClick={() =>
              setShowFilters((previous) => !previous)
            }
            className="
              w-full
              rounded-[18px]
              border
              border-[#303030]
              bg-[#0b0c0c]
              px-5
              py-4
              flex
              items-center
              justify-between
              text-left
              active:scale-[0.99]
              transition
            "
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                "
              >
                <Filter
                  size={21}
                  className="text-[#f5c542]"
                />
              </div>

              <div>

                <p className="text-white font-extrabold text-lg">
                  फिल्टर
                </p>

                <p className="text-[#8e8e8e] text-xs mt-0.5">
                  डिपॉजिट खोजने के लिए
                </p>

              </div>

            </div>

            <ChevronRight
              size={22}
              className={`
                text-[#f5c542]
                transition-transform
                ${showFilters ? "rotate-90" : ""}
              `}
            />

          </button>

        </div>

        {/* ==================================================
            FILTER CARD
        ================================================== */}

        {showFilters && (
          <div
            className="
              mt-3
              rounded-[20px]
              border
              border-[#80631f]
              p-4
            "
            style={{
              background:
                "linear-gradient(110deg, #141108 0%, #090909 70%)",
            }}
          >

            <form onSubmit={handleSearch}>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* STATUS */}

                <FilterInput label="स्थिति">

                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleChange}
                    className="themeInput"
                  >
                    <option value="">
                      सभी स्थिति
                    </option>

                    <option value="0">
                      प्रतीक्षारत
                    </option>

                    <option value="1">
                      सफल
                    </option>

                    <option value="2">
                      असफल
                    </option>

                    <option value="3">
                      रद्द
                    </option>
                  </select>

                </FilterInput>

                {/* PAYMENT METHOD */}

                <FilterInput label="भुगतान विधि">

                  <input
                    type="text"
                    name="paymentMethod"
                    value={filters.paymentMethod}
                    onChange={handleChange}
                    placeholder="भुगतान विधि"
                    className="themeInput"
                  />

                </FilterInput>

                {/* CHANNEL */}

                <FilterInput label="चैनल">

                  <input
                    type="text"
                    name="channel"
                    value={filters.channel}
                    onChange={handleChange}
                    placeholder="चैनल"
                    className="themeInput"
                  />

                </FilterInput>

                {/* PHONE */}

                <FilterInput label="फ़ोन">

                  <input
                    type="text"
                    name="phone"
                    value={filters.phone}
                    onChange={handleChange}
                    placeholder="फ़ोन नंबर"
                    className="themeInput"
                  />

                </FilterInput>

                {/* USERNAME */}

                <FilterInput label="उपयोगकर्ता नाम">

                  <input
                    type="text"
                    name="username"
                    value={filters.username}
                    onChange={handleChange}
                    placeholder="उपयोगकर्ता नाम"
                    className="themeInput"
                  />

                </FilterInput>

                {/* ORDER ID */}

                <FilterInput label="ऑर्डर आईडी">

                  <input
                    type="text"
                    name="orderId"
                    value={filters.orderId}
                    onChange={handleChange}
                    placeholder="ऑर्डर आईडी"
                    className="themeInput"
                  />

                </FilterInput>

                {/* TRANSACTION ID */}

                <FilterInput label="लेनदेन आईडी">

                  <input
                    type="text"
                    name="transactionId"
                    value={filters.transactionId}
                    onChange={handleChange}
                    placeholder="लेनदेन आईडी"
                    className="themeInput"
                  />

                </FilterInput>

                {/* UTR */}

                <FilterInput label="यूटीआर">

                  <input
                    type="text"
                    name="utr"
                    value={filters.utr}
                    onChange={handleChange}
                    placeholder="यूटीआर नंबर"
                    className="themeInput"
                  />

                </FilterInput>

                {/* FROM DATE */}

                <FilterInput label="दिनांक से">

                  <input
                    type="date"
                    name="fromDate"
                    value={filters.fromDate}
                    onChange={handleChange}
                    className="themeInput"
                  />

                </FilterInput>

                {/* TO DATE */}

                <FilterInput label="दिनांक तक">

                  <input
                    type="date"
                    name="toDate"
                    value={filters.toDate}
                    onChange={handleChange}
                    className="themeInput"
                  />

                </FilterInput>

                {/* MIN AMOUNT */}

                <FilterInput label="न्यूनतम राशि">

                  <input
                    type="number"
                    min="0"
                    name="minAmount"
                    value={filters.minAmount}
                    onChange={handleChange}
                    placeholder="न्यूनतम राशि"
                    className="themeInput"
                  />

                </FilterInput>

                {/* MAX AMOUNT */}

                <FilterInput label="अधिकतम राशि">

                  <input
                    type="number"
                    min="0"
                    name="maxAmount"
                    value={filters.maxAmount}
                    onChange={handleChange}
                    placeholder="अधिकतम राशि"
                    className="themeInput"
                  />

                </FilterInput>

                {/* SORT */}

                <FilterInput label="क्रमबद्ध करें">

                  <select
                    name="sort"
                    value={filters.sort}
                    onChange={handleChange}
                    className="themeInput"
                  >
                    <option value="desc">
                      नवीनतम पहले
                    </option>

                    <option value="asc">
                      पुराने पहले
                    </option>
                  </select>

                </FilterInput>

              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 mt-4">

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    flex-1
                    rounded-xl
                    py-3.5
                    text-black
                    font-extrabold
                    flex
                    items-center
                    justify-center
                    gap-2
                    disabled:opacity-50
                  "
                  style={{
                    background:
                      "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",

                    boxShadow:
                      "0 4px 18px rgba(245,197,66,0.20)",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      खोज रहे हैं...
                    </>
                  ) : (
                    <>
                      <Search size={18} />

                      खोजें
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="
                    rounded-xl
                    border
                    border-[#3a3a3a]
                    bg-[#111111]
                    px-5
                    py-3.5
                    text-white
                    font-bold
                    disabled:opacity-50
                  "
                >
                  रीसेट
                </button>

              </div>

            </form>

          </div>
        )}

        {/* ==================================================
            DEPOSITS
        ================================================== */}

        <div className="mt-5">

          <div className="flex items-center justify-between mb-3">

            <div>

              <h2 className="text-white text-xl font-extrabold">
                डिपॉजिट
              </h2>

              <p className="text-[#777] text-xs mt-1">
                आपके हाल के लेनदेन
              </p>

            </div>

            <div className="text-[#f5c542] text-sm font-bold">
              कुल {totalDeposits}
            </div>

          </div>

          {/* LOADING */}

          {loading ? (

            <div
              className="
                rounded-[20px]
                border
                border-[#80631f]
                bg-[#0b0c0c]
                py-16
                flex
                flex-col
                items-center
                justify-center
              "
            >

              <Loader2
                size={34}
                className="text-[#f5c542] animate-spin"
              />

              <p className="text-[#bcbcbc] text-sm mt-4">
                डिपॉजिट लोड हो रहे हैं...
              </p>

            </div>

          ) : deposits.length === 0 ? (

            /* EMPTY */

            <div
              className="
                rounded-[20px]
                border
                border-[#80631f]
                bg-[#0b0c0c]
                py-16
                px-5
                flex
                flex-col
                items-center
                justify-center
                text-center
              "
            >

              <div
                className="
                  w-20
                  h-20
                  rounded-full
                  border
                  border-[#80631f]
                  bg-black/50
                  flex
                  items-center
                  justify-center
                "
              >
                <Wallet
                  size={35}
                  className="text-[#f5c542]"
                />
              </div>

              <h3 className="text-white text-lg font-extrabold mt-5">
                अभी कोई डिपॉजिट नहीं है
              </h3>

              <p className="text-[#777] text-sm mt-2">
                आपके डिपॉजिट लेनदेन यहां दिखाई देंगे।
              </p>

            </div>

          ) : (

            <>

              {/* ==================================================
                  MOBILE CARDS
              ================================================== */}

              <div className="flex flex-col gap-3 md:hidden">

                {deposits.map(
                  (deposit, index) => {

                    const serialNumber =
                      ((pagination.currentPage || 1) - 1) *
                        (pagination.limit || 10) +
                      index +
                      1;

                    const statusInfo =
                      getStatusInfo(
                        deposit.status
                      );

                    return (
                      <div
                        key={
                          deposit._id ||
                          deposit.orderId ||
                          index
                        }
                        className="
                          rounded-[20px]
                          border
                          border-[#80631f]
                          bg-[#0b0c0c]
                          p-4
                        "
                      >

                        {/* CARD TOP */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                w-11
                                h-11
                                rounded-full
                                border
                                border-[#80631f]
                                bg-black/50
                                flex
                                items-center
                                justify-center
                                flex-shrink-0
                              "
                            >
                              <Wallet
                                size={21}
                                className="text-[#f5c542]"
                              />
                            </div>

                            <div>

                              <p className="text-[#777] text-[10px]">
                                ऑर्डर आईडी
                              </p>

                              <p className="text-white text-sm font-bold break-all">
                                {deposit.orderId || "-"}
                              </p>

                            </div>

                          </div>

                          {getStatusBadge(
                            deposit.status
                          )}

                        </div>

                        {/* AMOUNT */}

                        <div
                          className="
                            mt-4
                            rounded-xl
                            border
                            border-[#30270f]
                            bg-black/40
                            px-4
                            py-3
                            flex
                            items-center
                            justify-between
                          "
                        >

                          <div>

                            <p className="text-[#777] text-xs">
                              राशि
                            </p>

                            <p className="text-[#f5c542] text-xl font-extrabold mt-0.5">
                              {formatAmount(
                                deposit.amount
                              )}
                            </p>

                          </div>

                          <div className="text-right">

                            <p className="text-[#777] text-xs">
                              #{serialNumber}
                            </p>

                            <p className="text-[#aaa] text-xs mt-1">
                              {formatDate(
                                deposit.createdAt
                              )}
                            </p>

                          </div>

                        </div>

                        {/* DETAILS */}

                        <div className="grid grid-cols-2 gap-3 mt-4">

                          <DepositDetail
                            label="भुगतान"
                            value={
                              deposit.paymentMethod ||
                              "-"
                            }
                          />

                          <DepositDetail
                            label="चैनल"
                            value={
                              deposit.channel ||
                              "-"
                            }
                          />

                          <DepositDetail
                            label="लेनदेन"
                            value={
                              deposit.transactionId ||
                              "-"
                            }
                          />

                          <DepositDetail
                            label="यूटीआर"
                            value={
                              deposit.utr ||
                              "-"
                            }
                          />

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

              {/* ==================================================
                  DESKTOP TABLE
              ================================================== */}

              <div
                className="
                  hidden
                  md:block
                  rounded-[20px]
                  border
                  border-[#80631f]
                  bg-[#0b0c0c]
                  overflow-hidden
                "
              >

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px]">

                    <thead>

                      <tr className="border-b border-[#302b1c]">

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          #
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          ऑर्डर आईडी
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          राशि
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          भुगतान
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          लेनदेन
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          यूटीआर
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          स्थिति
                        </th>

                        <th className="px-4 py-4 text-left text-[11px] font-bold text-[#777]">
                          दिनांक
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {deposits.map(
                        (deposit, index) => {

                          const serialNumber =
                            ((pagination.currentPage || 1) - 1) *
                              (pagination.limit || 10) +
                            index +
                            1;

                          return (
                            <tr
                              key={
                                deposit._id ||
                                deposit.orderId ||
                                index
                              }
                              className="
                                border-b
                                border-[#201f1c]
                                last:border-b-0
                                hover:bg-[#11100c]
                                transition
                              "
                            >

                              <td className="px-4 py-4 text-sm text-[#777]">
                                {serialNumber}
                              </td>

                              <td className="px-4 py-4">

                                <p className="text-white text-sm font-bold">
                                  {deposit.orderId ||
                                    "-"}
                                </p>

                              </td>

                              <td className="px-4 py-4">

                                <p className="text-[#f5c542] text-sm font-extrabold">
                                  {formatAmount(
                                    deposit.amount
                                  )}
                                </p>

                              </td>

                              <td className="px-4 py-4 text-sm text-[#aaa]">
                                {deposit.paymentMethod ||
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-sm text-[#aaa]">
                                {deposit.transactionId ||
                                  "-"}
                              </td>

                              <td className="px-4 py-4 text-sm text-[#aaa]">
                                {deposit.utr || "-"}
                              </td>

                              <td className="px-4 py-4">
                                {getStatusBadge(
                                  deposit.status
                                )}
                              </td>

                              <td className="px-4 py-4">

                                <div className="flex items-center gap-2 text-[#aaa] text-xs">

                                  <CalendarDays
                                    size={14}
                                    className="text-[#f5c542]"
                                  />

                                  {formatDate(
                                    deposit.createdAt
                                  )}

                                </div>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          )}

        </div>

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {totalPages > 0 && (
          <div
            className="
              mt-4
              rounded-[20px]
              border
              border-[#80631f]
              bg-[#0b0c0c]
              px-4
              py-4
              flex
              flex-col
              sm:flex-row
              items-center
              justify-between
              gap-4
            "
          >

            <p className="text-[#777] text-xs">
              पेज{" "}
              <span className="text-white font-bold">
                {currentPage}
              </span>{" "}
              /{" "}
              <span className="text-white font-bold">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">

              {/* PREVIOUS */}

              <button
                type="button"
                disabled={
                  loading ||
                  currentPage <= 1
                }
                onClick={() =>
                  handlePageChange(
                    currentPage - 1
                  )
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  border
                  border-[#3a3a3a]
                  bg-[#111111]
                  flex
                  items-center
                  justify-center
                  text-[#f5c542]
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                "
              >
                <ChevronLeft size={18} />
              </button>

              {/* PAGE NUMBERS */}

              {getPageNumbers().map(
                (pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    disabled={loading}
                    onClick={() =>
                      handlePageChange(
                        pageNumber
                      )
                    }
                    className={`
                      min-w-[40px]
                      h-10
                      rounded-xl
                      text-sm
                      font-bold
                      transition
                      ${
                        currentPage ===
                        pageNumber
                          ? "text-black"
                          : "border border-[#3a3a3a] bg-[#111111] text-white"
                      }
                    `}
                    style={
                      currentPage ===
                      pageNumber
                        ? {
                            background:
                              "linear-gradient(180deg, #FFD966 0%, #f5c542 50%, #d4a017 100%)",
                          }
                        : undefined
                    }
                  >
                    {pageNumber}
                  </button>
                )
              )}

              {/* NEXT */}

              <button
                type="button"
                disabled={
                  loading ||
                  currentPage >=
                    totalPages
                }
                onClick={() =>
                  handlePageChange(
                    currentPage + 1
                  )
                }
                className="
                  w-10
                  h-10
                  rounded-xl
                  border
                  border-[#3a3a3a]
                  bg-[#111111]
                  flex
                  items-center
                  justify-center
                  text-[#f5c542]
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                "
              >
                <ChevronRight size={18} />
              </button>

            </div>

          </div>
        )}

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="mt-7 flex flex-col items-center">

          <div className="w-full flex items-center gap-4">

            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5c542] to-[#f5c542]" />

            <div className="text-[#f5c542]">

              <span className="text-xl">
                ✦
              </span>

            </div>

            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#f5c542] to-[#f5c542]" />

          </div>

          <p className="text-[#f5c542] text-[15px] mt-2">
            खेलो विश्वास के साथ
          </p>

        </div>

      </div>

      {/* ==================================================
          INLINE THEME STYLES
      ================================================== */}

      <style>{`
        .themeInput {
          width: 100%;
          height: 46px;
          border: 1px solid #3b3b3b;
          border-radius: 12px;
          padding: 0 13px;
          background: #111111;
          color: #ffffff;
          outline: none;
          font-size: 14px;
        }

        .themeInput::placeholder {
          color: #666666;
        }

        .themeInput:focus {
          border-color: #f5c542;
          box-shadow: 0 0 0 2px rgba(245, 197, 66, 0.08);
        }

        .themeInput option {
          background: #111111;
          color: #ffffff;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(80%) sepia(80%) saturate(500%) hue-rotate(5deg);
        }
      `}</style>
    </div>
  );
};

// ==========================================================
// FILTER INPUT
// ==========================================================

const FilterInput = ({
  label,
  children,
}) => {
  return (
    <div>

      <label className="block text-[#bcbcbc] text-xs font-semibold mb-2">
        {label}
      </label>

      {children}

    </div>
  );
};

// ==========================================================
// DEPOSIT DETAIL
// ==========================================================

const DepositDetail = ({
  label,
  value,
}) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#26231b]
        bg-black/30
        px-3
        py-2.5
        min-w-0
      "
    >

      <p className="text-[#666] text-[10px] uppercase">
        {label}
      </p>

      <p className="text-[#c9c9c9] text-xs font-semibold mt-1 truncate">
        {value}
      </p>

    </div>
  );
};

export default Deposit;