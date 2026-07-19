"use client";

import { useState, useMemo, useEffect } from "react";
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from "@xyflow/react";
import { useQueueQuery } from "../../hooks/use-queries";
import { Case } from "../../types";
import { VerdictBadge } from "../common/badge";
import "@xyflow/react/dist/style.css";
import { ExternalLink, ArrowRight } from "lucide-react";

export function KnowledgeGraphView() {
  const { data: fetchedItems = [] } = useQueueQuery();
  const [localCases, setLocalCases] = useState<Case[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Load local cases from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("local_cases");
    if (saved) {
      try {
        setLocalCases(JSON.parse(saved) as Case[]);
      } catch {
        // ignore
      }
    }
  }, []);

  const items = useMemo(() => {
    const fetchedIds = new Set(fetchedItems.map((item) => item.id));
    const filteredLocal = localCases.filter((item) => !fetchedIds.has(item.id));
    return [...filteredLocal, ...fetchedItems];
  }, [localCases, fetchedItems]);

  const graphItem = items[selectedIdx] || items[0];

  const initialNodes = useMemo(() => {
    if (!graphItem) return [];
    const rawSubject = graphItem.subject?.trim() || "";
    const unresolvedSubjects = new Set(["", "chưa xác định", "không xác định", "chưa rõ", "n/a", "unknown"]);
    const subjectName = unresolvedSubjects.has(rawSubject.toLowerCase())
      ? graphItem.account?.trim() || "Chưa xác định"
      : rawSubject;
    const originalContentUrl =
      graphItem.postUrl && graphItem.postUrl !== "#" ? graphItem.postUrl : "";
    const platformName =
      graphItem.platform === "Web" ? "Báo chí" : graphItem.platform === "Forum" ? "Khác" : graphItem.platform;
    return [
      {
        id: "claim",
        data: {
          label: (
            <div style={{ textAlign: "left" }}>
              <small style={{ color: "#3b82f6", fontSize: 10, fontWeight: 700 }}>CLAIM</small>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 0", color: "#fff", lineHeight: 1.4 }}>
                {graphItem.claim.slice(0, 80)}
                {graphItem.claim.length > 80 ? "..." : ""}
              </p>
            </div>
          ),
        },
        position: { x: 50, y: 100 },
        style: {
          background: "#1e293b",
          border: "2px solid #3b82f6",
          borderRadius: "12px",
          padding: "12px",
          width: 200,
        },
      },
      {
        id: "subject",
        data: {
          label: (
            <div style={{ textAlign: "left" }}>
              <small style={{ color: "#f59e0b", fontSize: 10, fontWeight: 700 }}>CHỦ THỂ</small>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 0", color: "#fff" }}>
                {subjectName}
              </p>
              <small style={{ color: "#94a3b8", display: "block", marginTop: "2px" }}>
                {platformName}{graphItem.account && graphItem.account !== subjectName ? ` · ${graphItem.account}` : ""}
              </small>
              {originalContentUrl && (
                <a
                  href={originalContentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="nodrag nopan"
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    color: "#fbbf24",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 6,
                    textDecoration: "none",
                  }}
                >
                  Mở nội dung của chủ thể <ExternalLink size={11} />
                </a>
              )}
            </div>
          ),
        },
        position: { x: 300, y: 100 },
        style: {
          background: "#1e293b",
          border: "2px solid #f59e0b",
          borderRadius: "12px",
          padding: "12px",
          width: 210,
        },
      },
      {
        id: "law",
        data: {
          label: (
            <div style={{ textAlign: "left" }}>
              <small style={{ color: "#8b5cf6", fontSize: 10, fontWeight: 700 }}>ĐIỀU LUẬT</small>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 0", color: "#fff" }}>
                {graphItem.document}
              </p>
              <small style={{ color: "#94a3b8", display: "block", marginTop: "2px" }}>
                {graphItem.provision}
              </small>
              <small style={{ color: "#f59e0b", display: "block", marginTop: "2px" }}>
                {graphItem.penalty}
              </small>
            </div>
          ),
        },
        position: { x: 530, y: 60 },
        style: {
          background: "#1e293b",
          border: "2px solid #8b5cf6",
          borderRadius: "12px",
          padding: "12px",
          width: 220,
        },
      },
      {
        id: "source",
        data: {
          label: (
            <div style={{ textAlign: "left" }}>
              <small style={{ color: "#22c55e", fontSize: 10, fontWeight: 700 }}>NGUỒN KIỂM CHỨNG</small>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 0", color: "#fff" }}>
                {graphItem.sourceAgency || "Đang tìm kiếm"}
              </p>
              <small style={{ color: "#94a3b8", display: "block", marginTop: "2px" }}>
                {graphItem.sourceTitle || "Chưa có nguồn"}
              </small>
              {graphItem.sourceUrl && graphItem.sourceUrl !== "#" && (
                <a
                  href={graphItem.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#3b82f6", fontSize: 11, display: "inline-block", marginTop: "4px" }}
                >
                  Mở nguồn <ExternalLink size={12} className="inline align-[-1px]" />
                </a>
              )}
            </div>
          ),
        },
        position: { x: 800, y: 100 },
        style: {
          background: "#1e293b",
          border: "2px solid #22c55e",
          borderRadius: "12px",
          padding: "12px",
          width: 200,
        },
      },
    ];
  }, [graphItem]);

  const initialEdges = useMemo(() => {
    if (!graphItem) return [];
    return [
      { id: "e-claim-subject", source: "claim", target: "subject", animated: true, style: { stroke: "#64748b", strokeWidth: 2 } },
      { id: "e-subject-law", source: "subject", target: "law", animated: true, style: { stroke: "#64748b", strokeWidth: 2 } },
      { id: "e-law-source", source: "law", target: "source", animated: true, style: { stroke: "#64748b", strokeWidth: 2 } },
    ];
  }, [graphItem]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update flow nodes and edges when selected item changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [graphItem, initialNodes, initialEdges, setNodes, setEdges]);

  if (!graphItem) {
    return (
      <div className="mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6">
        <div className="mb-[18px] flex items-center justify-between gap-[25px] max-[700px]:flex-col max-[700px]:items-start">
          <div>
            <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">KNOWLEDGE GRAPH</span>
            <h1 className="my-[6px] text-[38px] font-[760] tracking-[-1.6px] text-[#202944] max-[480px]:text-[31px]">Đồ thị tri thức</h1>
            <p className="m-0 text-[12px] text-[#738195]">Chưa có dữ liệu. Quét MXH hoặc nhập nội dung để xem đồ thị quan hệ.</p>
          </div>
        </div>
      </div>
    );
  }

  const relatedItems = items
    .filter((item) => item.document === graphItem.document && item.id !== graphItem.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-[1640px] px-[28px] pt-[25px] pb-8 max-[700px]:px-[15px] max-[700px]:pt-[26px] max-[700px]:pb-6">
      <div className="mb-[18px] flex items-center justify-between gap-[25px] max-[700px]:flex-col max-[700px]:items-start">
        <div>
          <span className="text-[10px] font-extrabold tracking-[1.5px] text-[#c01cad]">KNOWLEDGE GRAPH</span>
          <h1 className="my-[6px] text-[38px] font-[760] tracking-[-1.6px] text-[#202944] max-[480px]:text-[31px]">Đồ thị tri thức</h1>
          <p className="m-0 text-[12px] text-[#738195]">Quan hệ giữa Claim <ArrowRight size={14} className="inline align-[-2px]" /> Chủ thể <ArrowRight size={14} className="inline align-[-2px]" /> Điều luật <ArrowRight size={14} className="inline align-[-2px]" /> Nguồn kiểm chứng.</p>
        </div>
        <div className="flex items-center gap-2 max-[700px]:w-full">
          <select
            className="max-[700px]:w-full"
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #334155",
              background: "#1e293b",
              color: "#e2e8f0",
              fontSize: 13,
            }}
          >
            {items.map((item, idx) => (
              <option key={item.id} value={idx}>
                {item.claim.slice(0, 60)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="h-[350px] overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:h-[430px] max-[700px]:rounded-[14px]" style={{ marginBottom: 24, position: "relative" }}>
        <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            style={{ background: "#0b1329" }}
            colorMode="dark"
          >
            <Background color="#1e293b" gap={16} />
            <Controls style={{ background: "#1e293b", color: "#fff", border: "1px solid #334155" }} />
          </ReactFlow>
        </div>
      </section>

      <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]" style={{ marginBottom: 24 }}>
        <div style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 4 }}>Kết quả phân loại</h3>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
            AI đánh giá:{" "}
            <strong
              style={{
                color:
                  graphItem.verdict === "Đúng"
                    ? "#22c55e"
                    : graphItem.verdict === "Hiểu lầm"
                    ? "#ef4444"
                    : "#f59e0b",
              }}
            >
              {graphItem.verdict}
            </strong>{" "}
            · Score: {graphItem.score}/100
          </p>
          <div style={{ background: "#0f172a", borderRadius: 8, padding: 16 }}>
            <small style={{ color: "#94a3b8" }}>LÝ DO PHÂN LOẠI</small>
            <p style={{ marginTop: 4, color: "#cbd5e1" }}>{graphItem.reason}</p>
          </div>
        </div>
      </section>

      {relatedItems.length > 0 && (
        <section className="overflow-hidden rounded-[17px] bg-white shadow-[0_10px_30px_#28304f0b,0_2px_7px_#28304f08] max-[700px]:rounded-[14px]">
          <div style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 4 }}>Hồ sơ liên quan (cùng văn bản)</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
              {relatedItems.length} hồ sơ khác cùng viện dẫn {graphItem.document}
            </p>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">CLAIM</th>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">CHỦ THỂ</th>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">ĐIỀU KHOẢN</th>
                  <th className="border-b border-[#eff1f5] bg-[#fafbfe] px-3 py-2.5 text-left text-[8px] font-[650] tracking-[.55px] text-[#989dae]">ĐÁNH GIÁ</th>
                </tr>
              </thead>
              <tbody>
                {relatedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">
                      <strong className="block max-w-[280px] text-[11px] leading-[1.4] text-[#26384d]">{item.claim.slice(0, 60)}</strong>
                    </td>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{item.subject}</td>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">{item.provision}</td>
                    <td className="border-b border-[#f0f1f5] px-3 py-[11px] align-middle text-[10px] text-[#445468]">
                      <VerdictBadge value={item.verdict} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </section>
      )}
    </div>
  );
}
