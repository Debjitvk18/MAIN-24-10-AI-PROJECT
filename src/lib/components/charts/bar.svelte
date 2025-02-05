<script>
	import { onMount } from 'svelte';
	import ApexChart from './ApexChart.svelte';

    function getCSSVariable(name) {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}
	let options;
  	let series;
	
	onMount(() => {
		options = {
			chart: {
			type: 'bar',
			toolbar: { show: false }, // Hide unnecessary tools
			animations: {
				enabled: true,
				easing: 'easeinout',
				speed: 800
			}
			},
			plotOptions: {
			bar: {
				borderRadius: 6,
				horizontal: false,
				columnWidth: '70%' // Adjust bar width
			}
			},
			dataLabels: {
			enabled: false 
			},
			colors: [
				'#3b82f6', 
			],
			xaxis: {
			categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			},
			yaxis: {
			},
			tooltip: {
			theme: 'dark'
			}
		};

		series = [
			{
			name: 'Sales',
			data: [10, 20, 30, 40, 50, 42, 35, 78, 60, 35, 78,54]
			}
		];
	});

  </script>
  
  <div class="w-full">
	<ApexChart {options} {series} />
  </div>
  