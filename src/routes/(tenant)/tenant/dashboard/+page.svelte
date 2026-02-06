<script>
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { Chart, registerables } from 'chart.js';
	import {
		TrendingUp, TrendingDown, ShoppingCart, Receipt, Package, AlertTriangle,
		ArrowRight, ArrowUpRight, Clock, User, Mail, Store, Settings,
		BarChart3, Boxes, CreditCard, ChevronRight
	} from 'lucide-svelte';

	onMount(() => {
		Chart.register(...registerables);
	});

	export let data;

	$: user = data?.user;
	$: stats = data?.stats;
	$: chartData = data?.chartData;
	$: recentTransactions = data?.recentTransactions || [];
	$: topProducts = data?.topProducts || [];
	$: alerts = data?.alerts || [];

	let chartElement;
	let chartInstance = null;

	$: if (chartData && chartElement && chartInstance) {
		chartInstance.data.labels = chartData.labels;
		chartInstance.data.datasets[0].data = chartData.data;
		chartInstance.update();
	}

	$: if (chartElement && chartData && !chartInstance) {
		initChart();
	}

	function initChart() {
		if (!chartElement || !chartData) return;

		if (chartInstance) {
			chartInstance.destroy();
		}

		const ctx = chartElement.getContext('2d');
		chartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels: chartData.labels,
				datasets: [{
					label: 'Penjualan',
					data: chartData.data,
					borderColor: '#10b981',
					backgroundColor: 'rgba(16, 185, 129, 0.08)',
					fill: true,
					tension: 0.4,
					pointRadius: 0,
					pointHoverRadius: 6,
					pointBackgroundColor: '#10b981',
					pointBorderColor: '#fff',
					pointBorderWidth: 2,
					borderWidth: 2
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: '#1f2937',
						padding: 12,
						cornerRadius: 8,
						titleFont: { size: 12, weight: '500' },
						bodyFont: { size: 13, weight: '600' },
						displayColors: false,
						callbacks: {
							label: function(context) {
								return 'Rp ' + context.parsed.y.toLocaleString('id-ID');
							}
						}
					}
				},
				scales: {
					x: {
						grid: {
							display: false
						},
						border: {
							display: false
						},
						ticks: {
							font: { size: 11 },
							color: '#9ca3af'
						}
					},
					y: {
						beginAtZero: true,
						border: {
							display: false
						},
						grid: {
							color: '#f3f4f6'
						},
						ticks: {
							font: { size: 11 },
							color: '#9ca3af',
							padding: 8,
							callback: function(value) {
								if (value >= 1000000) {
									return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
								} else if (value >= 1000) {
									return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
								}
								return 'Rp ' + value;
							}
						}
					}
				},
				interaction: {
					intersect: false,
					mode: 'index'
				}
			}
		});
	}

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	});

	function formatRupiah(angka) {
		if (!angka) return 'Rp 0';
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(angka);
	}

	function formatRupiahShort(angka) {
		if (!angka) return 'Rp 0';
		if (angka >= 1000000) {
			return 'Rp ' + (angka / 1000000).toFixed(1) + ' jt';
		} else if (angka >= 1000) {
			return 'Rp ' + (angka / 1000).toFixed(0) + ' rb';
		}
		return 'Rp ' + angka;
	}

	function formatTime(waktu) {
		if (!waktu) return '';
		return waktu.substring(0, 5);
	}

	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Selamat Pagi';
		if (hour < 15) return 'Selamat Siang';
		if (hour < 18) return 'Selamat Sore';
		return 'Selamat Malam';
	}

	function getCurrentDate() {
		return new Date().toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dashboard - {user?.nama_bisnis || 'Toko Saya'}</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
		<div>
			<p class="text-sm text-slate-500">{getCurrentDate()}</p>
			<h1 class="text-xl sm:text-2xl font-semibold text-slate-800 mt-1">
				{getGreeting()}, {user?.nama?.split(' ')[0] || 'User'}
			</h1>
		</div>
		<a
			href="/tenant/kasir"
			class="inline-flex items-center justify-center gap-2 px-5 py-2.5 
			       bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 
			       transition-colors text-sm font-medium w-full sm:w-auto"
		>
			<ShoppingCart class="w-4 h-4" />
			<span>Buka Kasir</span>
		</a>
	</div>

	<!-- Alerts -->
	{#if alerts && alerts.length > 0}
		<div class="space-y-2">
			{#each alerts as alert}
				<div 
					class="flex items-center gap-3 px-4 py-3 rounded-lg border bg-white
					       {alert.type === 'warning' ? 'border-amber-200' : 'border-slate-200'}"
				>
					{#if alert.type === 'warning'}
						<AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0" />
					{:else}
						<div class="w-4 h-4 rounded-full bg-slate-200 flex-shrink-0"></div>
					{/if}
					<div class="flex-1 min-w-0">
						<p class="text-sm text-slate-700">{alert.message}</p>
					</div>
					{#if alert.link}
						<a href={alert.link} class="text-sm text-emerald-600 hover:text-emerald-700 font-medium whitespace-nowrap">
							Lihat
						</a>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Penjualan Hari Ini -->
		<div class="bg-white rounded-xl border border-slate-200 p-5">
			<div class="flex items-center justify-between">
				<div class="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
					<CreditCard class="w-5 h-5 text-emerald-600" />
				</div>
				<div class="flex items-center gap-1 text-emerald-600">
					<TrendingUp class="w-3.5 h-3.5" />
					<span class="text-xs font-medium">+12%</span>
				</div>
			</div>
			<div class="mt-4">
				<p class="text-2xl font-semibold text-slate-800">{formatRupiahShort(stats?.penjualanHariIni || 0)}</p>
				<p class="text-sm text-slate-500 mt-1">Penjualan Hari Ini</p>
			</div>
		</div>

		<!-- Transaksi -->
		<div class="bg-white rounded-xl border border-slate-200 p-5">
			<div class="flex items-center justify-between">
				<div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
					<Receipt class="w-5 h-5 text-slate-600" />
				</div>
				<div class="flex items-center gap-1 text-emerald-600">
					<TrendingUp class="w-3.5 h-3.5" />
					<span class="text-xs font-medium">+8</span>
				</div>
			</div>
			<div class="mt-4">
				<p class="text-2xl font-semibold text-slate-800">{stats?.transaksiHariIni || 0}</p>
				<p class="text-sm text-slate-500 mt-1">Total Transaksi</p>
			</div>
		</div>

		<!-- Produk Terjual -->
		<div class="bg-white rounded-xl border border-slate-200 p-5">
			<div class="flex items-center justify-between">
				<div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
					<Package class="w-5 h-5 text-slate-600" />
				</div>
			</div>
			<div class="mt-4">
				<p class="text-2xl font-semibold text-slate-800">{stats?.produkTerjual || 0}</p>
				<p class="text-sm text-slate-500 mt-1">Produk Terjual</p>
			</div>
		</div>

		<!-- Stok Menipis -->
		<div class="bg-white rounded-xl border border-slate-200 p-5">
			<div class="flex items-center justify-between">
				<div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
					<Boxes class="w-5 h-5 text-slate-600" />
				</div>
				{#if (stats?.stokMenipis || 0) > 0}
					<span class="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
						Perlu Restock
					</span>
				{/if}
			</div>
			<div class="mt-4">
				<p class="text-2xl font-semibold text-slate-800">{stats?.stokMenipis || 0}</p>
				<p class="text-sm text-slate-500 mt-1">Stok Menipis</p>
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="grid lg:grid-cols-3 gap-6">

		<!-- Left Column -->
		<div class="lg:col-span-2 space-y-6">

			<!-- Chart -->
			<div class="bg-white rounded-xl border border-slate-200 p-5">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-base font-semibold text-slate-800">Penjualan</h2>
						<p class="text-sm text-slate-500 mt-0.5">7 hari terakhir</p>
					</div>
					<a href="/tenant/laporan" class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
						Detail
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>
				{#if chartData}
					<div class="h-64">
						<canvas bind:this={chartElement}></canvas>
					</div>
				{:else}
					<div class="h-64 flex items-center justify-center text-slate-400 text-sm">
						Data tidak tersedia
					</div>
				{/if}
			</div>

			<!-- Recent Transactions -->
			<div class="bg-white rounded-xl border border-slate-200">
				<div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
					<h2 class="text-base font-semibold text-slate-800">Transaksi Terakhir</h2>
					<a href="/tenant/transaksi" class="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
						Lihat Semua
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>

				{#if recentTransactions.length > 0}
					<div class="divide-y divide-slate-100">
						{#each recentTransactions as trx, index}
							<div 
								class="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
								in:fly={{ y: 10, delay: index * 50, duration: 200 }}
							>
								<div class="flex items-center gap-4">
									<div class="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
										<Receipt class="w-4 h-4 text-emerald-600" />
									</div>
									<div>
										<p class="text-sm font-medium text-slate-800">{trx.no_invoice}</p>
										<p class="text-xs text-slate-500 mt-0.5">{trx.jumlah_item} item</p>
									</div>
								</div>
								<div class="text-right">
									<p class="text-sm font-semibold text-slate-800">{formatRupiah(trx.total)}</p>
									<p class="text-xs text-slate-400 mt-0.5">{formatTime(trx.waktu)}</p>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="px-5 py-12 text-center">
						<Receipt class="w-10 h-10 text-slate-300 mx-auto mb-3" />
						<p class="text-sm text-slate-500">Belum ada transaksi hari ini</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Column -->
		<div class="space-y-6">

			<!-- Top Products -->
			<div class="bg-white rounded-xl border border-slate-200">
				<div class="px-5 py-4 border-b border-slate-100">
					<h2 class="text-base font-semibold text-slate-800">Produk Terlaris</h2>
					<p class="text-sm text-slate-500 mt-0.5">Hari ini</p>
				</div>

				{#if topProducts.length > 0}
					<div class="p-4 space-y-3">
						{#each topProducts as product, index}
							<div 
								class="flex items-center gap-3"
								in:fly={{ x: 10, delay: index * 50, duration: 200 }}
							>
								<div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0
									{index === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
									{index + 1}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-slate-800 truncate">{product.nama_produk}</p>
									<p class="text-xs text-slate-500">{product.total_terjual} terjual</p>
								</div>
								<p class="text-sm font-medium text-slate-700">{formatRupiahShort(product.total_pendapatan)}</p>
							</div>
						{/each}
					</div>
				{:else}
					<div class="px-5 py-10 text-center">
						<Package class="w-10 h-10 text-slate-300 mx-auto mb-3" />
						<p class="text-sm text-slate-500">Belum ada data</p>
					</div>
				{/if}
			</div>

			<!-- Quick Actions -->
			<div class="bg-white rounded-xl border border-slate-200 p-5">
				<h2 class="text-base font-semibold text-slate-800 mb-4">Aksi Cepat</h2>
				<div class="grid grid-cols-2 gap-3">
					<a 
						href="/tenant/kasir" 
						class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 
						       hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
					>
						<ShoppingCart class="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
						<span class="text-xs font-medium text-slate-600 group-hover:text-emerald-700">Kasir</span>
					</a>
					<a 
						href="/tenant/produk" 
						class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 
						       hover:border-slate-300 hover:bg-slate-50 transition-colors group"
					>
						<Package class="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
						<span class="text-xs font-medium text-slate-600">Produk</span>
					</a>
					<a 
						href="/tenant/laporan" 
						class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 
						       hover:border-slate-300 hover:bg-slate-50 transition-colors group"
					>
						<BarChart3 class="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
						<span class="text-xs font-medium text-slate-600">Laporan</span>
					</a>
					<a 
						href="/tenant/pengaturan" 
						class="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 
						       hover:border-slate-300 hover:bg-slate-50 transition-colors group"
					>
						<Settings class="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
						<span class="text-xs font-medium text-slate-600">Pengaturan</span>
					</a>
				</div>
			</div>

			<!-- Store Info -->
			<div class="bg-slate-800 rounded-xl p-5">
				<div class="flex items-center gap-3 mb-5">
					<div class="w-11 h-11 bg-white/10 rounded-lg flex items-center justify-center">
						<Store class="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 class="font-semibold text-white text-sm">{user?.nama_bisnis || 'Toko Saya'}</h3>
						<p class="text-slate-400 text-xs">{user?.kode_pelanggan || ''}</p>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-3 text-sm">
						<User class="w-4 h-4 text-slate-500" />
						<span class="text-slate-300">{user?.nama || 'Pemilik'}</span>
					</div>
					<div class="flex items-center gap-3 text-sm">
						<Mail class="w-4 h-4 text-slate-500" />
						<span class="text-slate-300 truncate">{user?.email || '-'}</span>
					</div>
				</div>

				<div class="mt-5 pt-4 border-t border-white/10">
					<a 
						href="/tenant/pengaturan" 
						class="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
					>
						<span>Edit Profil</span>
						<ArrowRight class="w-4 h-4" />
					</a>
				</div>
			</div>

		</div>
	</div>
</div>