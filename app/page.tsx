"use client";

import React, { useMemo, useState } from "react";

type FormState = {
  productName: string;
  customer: string;
  materialType: string;
  netWeight: number | string;
  grossWeight: number | string;
  cycleTime: number | string;
  cavities: number | string;
  yieldRate: number | string;
  materialPrice: number | string;
  modifiedPrice: number | string;
  qualityLossRate: number | string;
  specialLossRate: number | string;
  machineDailyCost: number | string;
  hardwareCost: number | string;
  sprayCost: number | string;
  printCost: number | string;
  laserCost: number | string;
  glueCost: number | string;
  packagingCost: number | string;
  businessFee: number | string;
  taxRate: number | string;
  orderQty: number | string;
  targetGrossMargin: number | string;
  minUnitProfit: number | string;
  customerTargetPrice: number | string;
  customerSuppliedMaterial: boolean;
  moqPurchaseKg: number | string;
  startupLossKg: number | string;
  useMoqAllocation: boolean;
};

type PricingResult = {
  recommendedPriceByNetWeight: number;
  recommendedPriceByGrossWeight: number;
  normalCostByNetWeight: number;
  normalCostByGrossWeight: number;
  moqTotalCost: number;
  smallOrderAllocatedUnitCost: number;
  targetPoUnitPrice: number;
  hourlyCapacity: number;
  dailyCapacity: number;
  processingCost: number;
  materialCost: number;
  subtotal: number;
  taxBase: number;
  tax: number;
  normalCost: number;
  effectiveMoqKg: number;
  moqCapacity: number;
  moqMaterialCost: number;
  moqUnitCost: number;
  useMoq: boolean;
  finalApplicableCost: number;
  breakEvenPrice: number;
  minAcceptablePrice: number;
  recommendedPrice: number;
  unitGap: number;
  totalGap: number;
  advice: string;
};

function toNumber(value: number | string, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const normalized = String(value ?? "").trim();
  if (normalized === "") return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value: number, digits = 4): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.0000";
}

function calculatePricing(form: FormState): PricingResult {
  const netWeight = Math.max(toNumber(form.netWeight), 0);
  const grossWeight = Math.max(toNumber(form.grossWeight), 0);
  const cycleTime = Math.max(toNumber(form.cycleTime), 0);
  const cavities = Math.max(toNumber(form.cavities), 1);
  const yieldRate = clamp(toNumber(form.yieldRate) / 100, 0, 1);
  const materialPrice = Math.max(toNumber(form.materialPrice), 0);
  const modifiedPrice = Math.max(toNumber(form.modifiedPrice), 0);
  const qualityLossRate = Math.max(toNumber(form.qualityLossRate, 1), 0);
  const specialLossRate = Math.max(toNumber(form.specialLossRate, 1), 0);
  const machineDailyCost = Math.max(toNumber(form.machineDailyCost), 0);
  const hardwareCost = Math.max(toNumber(form.hardwareCost), 0);
  const sprayCost = Math.max(toNumber(form.sprayCost), 0);
  const printCost = Math.max(toNumber(form.printCost), 0);
  const laserCost = Math.max(toNumber(form.laserCost), 0);
  const glueCost = Math.max(toNumber(form.glueCost), 0);
  const packagingCost = Math.max(toNumber(form.packagingCost), 0);
  const businessFee = Math.max(toNumber(form.businessFee), 0);
  const taxRate = Math.max(toNumber(form.taxRate) / 100, 0);
  const orderQty = Math.max(toNumber(form.orderQty), 0);
  const targetGrossMargin = clamp(toNumber(form.targetGrossMargin) / 100, 0, 0.999999);
  const minUnitProfit = Math.max(toNumber(form.minUnitProfit), 0);
  const customerTargetPrice = Math.max(toNumber(form.customerTargetPrice), 0);
  const customerSuppliedMaterial = Boolean(form.customerSuppliedMaterial);
  const moqPurchaseKg = Math.max(toNumber(form.moqPurchaseKg), 0);
  const startupLossKg = Math.max(toNumber(form.startupLossKg), 0);
  const useMoqAllocation = Boolean(form.useMoqAllocation);

  const effectiveMoqKg = Math.max(moqPurchaseKg - startupLossKg, 0);
  const hourlyCapacity = cycleTime > 0 ? (3600 / cycleTime) * cavities * yieldRate : 0;
  const dailyCapacity = hourlyCapacity * 23;
  const processingCost = dailyCapacity > 0 ? machineDailyCost / dailyCapacity : 0;

  const materialCost = customerSuppliedMaterial
    ? 0
    : (netWeight * (materialPrice + modifiedPrice) / 1000) * qualityLossRate * specialLossRate;

  const materialCostByGrossWeight = customerSuppliedMaterial
    ? 0
    : (grossWeight * (materialPrice + modifiedPrice) / 1000) * qualityLossRate * specialLossRate;

  const subtotal =
    processingCost +
    materialCost +
    hardwareCost +
    sprayCost +
    printCost +
    laserCost +
    glueCost +
    packagingCost;

  const subtotalByGrossWeight =
    processingCost +
    materialCostByGrossWeight +
    hardwareCost +
    sprayCost +
    printCost +
    laserCost +
    glueCost +
    packagingCost;

  const taxBase = processingCost + laserCost + businessFee;
  const tax = taxBase * taxRate;
  const normalCost = subtotal + tax;
  const normalCostByNetWeight = normalCost;
  const normalCostByGrossWeight = subtotalByGrossWeight + tax;

  const moqCapacity = grossWeight > 0 ? (effectiveMoqKg * 1000) / grossWeight : 0;
  const moqMaterialCost = customerSuppliedMaterial
    ? 0
    : moqCapacity > 0
      ? ((materialPrice + modifiedPrice) * moqPurchaseKg / moqCapacity) * qualityLossRate * specialLossRate
      : 0;
  const moqUnitCost = processingCost + moqMaterialCost;
  const moqTaxPerUnit = (processingCost + laserCost + businessFee) * taxRate;
  const moqFullUnitCost = moqUnitCost + moqTaxPerUnit;
  const moqTotalCost = moqFullUnitCost * moqCapacity;
  const smallOrderAllocatedUnitCost = orderQty > 0 ? moqTotalCost / orderQty : moqFullUnitCost;

  const targetPoUnitPrice = Math.max(
    customerTargetPrice - businessFee - hardwareCost - sprayCost - printCost - laserCost - glueCost - packagingCost,
    0,
  );

  const useMoq = useMoqAllocation && orderQty > 0 && moqCapacity > 0 && orderQty < moqCapacity;
  // 小单触发 MOQ 时，当前订单的最终适用成本按 MOQ 总成本平摊到实际订单数量。
  const finalApplicableCost = useMoq ? moqTotalCost / orderQty : normalCost;
  const breakEvenPrice = finalApplicableCost;
  const minAcceptablePrice = finalApplicableCost + minUnitProfit;
  const recommendedPrice = finalApplicableCost / (1 - targetGrossMargin);
  const recommendedPriceByNetWeight = normalCostByNetWeight / (1 - targetGrossMargin);
  const recommendedPriceByGrossWeight = normalCostByGrossWeight / (1 - targetGrossMargin);
  const unitGap = targetPoUnitPrice > 0 ? targetPoUnitPrice - finalApplicableCost : 0;
  const totalGap = unitGap * orderQty;

  let advice = "待评估";
  if (customerTargetPrice > 0) {
    if (unitGap > 0.03) advice = "可接";
    else if (unitGap >= 0) advice = "薄利可接";
    else advice = "建议重报";
  }

  return {
    recommendedPriceByNetWeight,
    recommendedPriceByGrossWeight,
    normalCostByNetWeight,
    normalCostByGrossWeight,
    moqTotalCost,
    smallOrderAllocatedUnitCost,
    targetPoUnitPrice,
    hourlyCapacity,
    dailyCapacity,
    processingCost,
    materialCost,
    subtotal,
    taxBase,
    tax,
    normalCost,
    effectiveMoqKg,
    moqCapacity,
    moqMaterialCost,
    moqUnitCost,
    useMoq,
    finalApplicableCost,
    breakEvenPrice,
    minAcceptablePrice,
    recommendedPrice,
    unitGap,
    totalGap,
    advice,
  };
}

const defaultForm: FormState = {
  productName: "",
  customer: "",
  materialType: "PC",
  netWeight: 19.5,
  grossWeight: 20.82,
  cycleTime: 22,
  cavities: 2,
  yieldRate: 95,
  materialPrice: 11.5,
  modifiedPrice: 0,
  qualityLossRate: 1.05,
  specialLossRate: 1.05,
  machineDailyCost: 1600,
  hardwareCost: 0,
  sprayCost: 0,
  printCost: 0,
  laserCost: 0,
  glueCost: 0,
  packagingCost: 0,
  businessFee: 0,
  taxRate: 13,
  orderQty: 5000,
  targetGrossMargin: 15,
  minUnitProfit: 0.02,
  customerTargetPrice: 0,
  customerSuppliedMaterial: true,
  moqPurchaseKg: 25,
  startupLossKg: 3,
  useMoqAllocation: true,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, step = "any" }: { value: string | number; onChange: (value: string) => void; step?: string }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
    />
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
    />
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function ResultCard({ title, rows }: { title: string; rows: Array<{ label: string; value: string | number; strong?: boolean }> }) {
  return (
    <Panel title={title}>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-b-0">
            <span className="text-sm text-slate-600">{row.label}</span>
            <span className={row.strong ? "text-sm font-semibold text-slate-900" : "text-sm text-slate-900"}>
              {typeof row.value === "number" ? formatNumber(row.value) : row.value}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function Page() {
  const [form, setForm] = useState<FormState>(defaultForm);

  const update = <K extends keyof FormState,>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const calc = useMemo(() => calculatePricing(form), [form]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">注塑件单价计算器</h1>
          <p className="mt-2 text-sm text-slate-600">简易版，保留当前核算逻辑，适合直接部署后给销售和内部核价人员使用。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Panel title="基础输入">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="产品名称"><TextInput value={form.productName} onChange={(value) => update("productName", value)} /></Field>
                <Field label="客户名称"><TextInput value={form.customer} onChange={(value) => update("customer", value)} /></Field>
                <Field label="材质"><TextInput value={form.materialType} onChange={(value) => update("materialType", value)} /></Field>
                <Field label="净重(g)"><NumberInput value={form.netWeight} onChange={(value) => update("netWeight", value)} /></Field>
                <Field label="毛重(g)"><NumberInput value={form.grossWeight} onChange={(value) => update("grossWeight", value)} /></Field>
                <Field label="周期(秒)"><NumberInput value={form.cycleTime} onChange={(value) => update("cycleTime", value)} /></Field>
                <Field label="穴数"><NumberInput value={form.cavities} onChange={(value) => update("cavities", value)} step="1" /></Field>
                <Field label="良率(%)"><NumberInput value={form.yieldRate} onChange={(value) => update("yieldRate", value)} /></Field>
                <div className="flex items-end rounded-xl border border-slate-200 px-3 py-2">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.customerSuppliedMaterial}
                      onChange={(e) => update("customerSuppliedMaterial", e.target.checked)}
                      className="h-4 w-4"
                    />
                    客供料
                  </label>
                </div>
              </div>
            </Panel>

            <Panel title="费用参数">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="材料单价(元/kg)"><NumberInput value={form.materialPrice} onChange={(value) => update("materialPrice", value)} /></Field>
                <Field label="改性/配色单价(元/kg)"><NumberInput value={form.modifiedPrice} onChange={(value) => update("modifiedPrice", value)} /></Field>
                <Field label="品质损耗率"><NumberInput value={form.qualityLossRate} onChange={(value) => update("qualityLossRate", value)} step="0.01" /></Field>
                <Field label="专用料损耗率"><NumberInput value={form.specialLossRate} onChange={(value) => update("specialLossRate", value)} step="0.01" /></Field>
                <Field label="机台费(元/23小时/天)"><NumberInput value={form.machineDailyCost} onChange={(value) => update("machineDailyCost", value)} /></Field>
                <Field label="业务费(元/件)"><NumberInput value={form.businessFee} onChange={(value) => update("businessFee", value)} /></Field>
                <Field label="五金费(元/件)"><NumberInput value={form.hardwareCost} onChange={(value) => update("hardwareCost", value)} /></Field>
                <Field label="喷油费(元/件)"><NumberInput value={form.sprayCost} onChange={(value) => update("sprayCost", value)} /></Field>
                <Field label="丝印费(元/件)"><NumberInput value={form.printCost} onChange={(value) => update("printCost", value)} /></Field>
                <Field label="镭雕费(元/件)"><NumberInput value={form.laserCost} onChange={(value) => update("laserCost", value)} /></Field>
                <Field label="贴胶费(元/件)"><NumberInput value={form.glueCost} onChange={(value) => update("glueCost", value)} /></Field>
                <Field label="包装费(元/件)"><NumberInput value={form.packagingCost} onChange={(value) => update("packagingCost", value)} /></Field>
              </div>
            </Panel>

            <Panel title="报价参数">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="税率(%)"><NumberInput value={form.taxRate} onChange={(value) => update("taxRate", value)} /></Field>
                <Field label="订单数量"><NumberInput value={form.orderQty} onChange={(value) => update("orderQty", value)} step="1" /></Field>
                <Field label="目标毛利率(%)"><NumberInput value={form.targetGrossMargin} onChange={(value) => update("targetGrossMargin", value)} /></Field>
                <Field label="最低利润要求(元/件)"><NumberInput value={form.minUnitProfit} onChange={(value) => update("minUnitProfit", value)} /></Field>
                <Field label="客户目标价(元/件)"><NumberInput value={form.customerTargetPrice} onChange={(value) => update("customerTargetPrice", value)} /></Field>
                <Field label="起购料重(kg)"><NumberInput value={form.moqPurchaseKg} onChange={(value) => update("moqPurchaseKg", value)} /></Field>
                <Field label="开机损耗(kg)"><NumberInput value={form.startupLossKg} onChange={(value) => update("startupLossKg", value)} /></Field>
                <div className="flex items-end rounded-xl border border-slate-200 px-3 py-2">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.useMoqAllocation}
                      onChange={(e) => update("useMoqAllocation", e.target.checked)}
                      className="h-4 w-4"
                    />
                    订单不足MOQ时自动切换MOQ逻辑
                  </label>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <ResultCard
              title="正常量产核算"
              rows={[
                { label: "每小时产能(PCS)", value: calc.hourlyCapacity },
                { label: "日产能(PCS)", value: calc.dailyCapacity },
                { label: "加工费/件", value: calc.processingCost },
                { label: "材料费/件(按净重)", value: calc.materialCost },
                { label: "税金", value: calc.tax },
                { label: "核算单价（按净重）", value: calc.normalCostByNetWeight, strong: true },
                { label: "核算单价（按毛重）", value: calc.normalCostByGrossWeight, strong: true },
              ]}
            />

            <ResultCard
              title="MOQ核算"
              rows={[
                { label: "有效生产料重(kg)", value: calc.effectiveMoqKg },
                { label: "MOQ产能(PCS)", value: calc.moqCapacity },
                { label: "MOQ材料单价", value: calc.moqMaterialCost },
                { label: "MOQ基础单价(未平摊税金)", value: calc.moqUnitCost },
                { label: "MOQ总成本(含加工费+税金)", value: calc.moqTotalCost, strong: true },
                { label: "小单平摊单价", value: calc.smallOrderAllocatedUnitCost, strong: true },
                { label: "是否触发MOQ", value: calc.useMoq ? "是" : "否" },
              ]}
            />

            <ResultCard
              title="报价结果"
              rows={[
                { label: "注塑件PO单价", value: calc.targetPoUnitPrice, strong: true },
                { label: "最终适用成本", value: calc.finalApplicableCost, strong: true },
                { label: "保本价", value: calc.breakEvenPrice },
                { label: "最低可接价", value: calc.minAcceptablePrice },
                { label: "推荐报价（当前订单）", value: calc.recommendedPrice, strong: true },
                { label: "推荐报价（按净重，正常量产参考）", value: calc.recommendedPriceByNetWeight, strong: true },
                { label: "推荐报价（按毛重，正常量产保守参考）", value: calc.recommendedPriceByGrossWeight, strong: true },
                { label: "注塑件PO价差", value: calc.unitGap },
                { label: "总价差金额", value: calc.totalGap },
                { label: "接单建议", value: calc.advice, strong: true },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
