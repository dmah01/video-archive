type PaginationProps = {
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function Pagination({
  currentPage,
  totalPages,
  setCurrentPage,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">

      <button
        onClick={() =>
          setCurrentPage((page) =>
            Math.max(1, page - 1)
          )
        }
        disabled={currentPage === 1}
        className="rounded-xl border border-zinc-800 px-4 py-2 text-sm disabled:opacity-30"
      >
        이전
      </button>

      {Array.from(
        { length: totalPages },
        (_, index) => index + 1
      ).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`rounded-xl px-4 py-2 text-sm ${
            currentPage === page
              ? "bg-white text-black"
              : "border border-zinc-800 text-zinc-400"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() =>
          setCurrentPage((page) =>
            Math.min(totalPages, page + 1)
          )
        }
        disabled={currentPage === totalPages}
        className="rounded-xl border border-zinc-800 px-4 py-2 text-sm disabled:opacity-30"
      >
        다음
      </button>

    </div>
  );
}