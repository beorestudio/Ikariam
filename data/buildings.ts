import { Building, ResourceType, BuildingCost } from '../types';

// --- Parser Helpers ---

// Parse formatted strings like "1.234", "1,5M", "1,07G"
const p = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = val.toString().trim();
  let m = 1;
  
  // Handle suffixes
  if (s.endsWith('M')) { 
    m = 1000000; 
    s = s.slice(0, -1).replace(',', '.'); 
  } else if (s.endsWith('G')) { 
    m = 1000000000; 
    s = s.slice(0, -1).replace(',', '.'); 
  } else if (s.endsWith('k')) { 
    m = 1000; 
    s = s.slice(0, -1).replace(',', '.'); 
  } else { 
    // Remove thousand separators (dots) usually found in PT-BR "1.234" -> "1234"
    // Keep decimal commas for now if any, though regular resources are integers.
    // Assuming inputs like "1.234" (1234) or "1,2M" (1.2 * 10^6)
    s = s.replace(/\./g, ''); 
  }
  
  return Math.round(parseFloat(s) * m);
};

// Resource Object Helper
const r = (w: any = 0, wi: any = 0, m: any = 0, c: any = 0, s: any = 0) => ({
  [ResourceType.Madeira]: p(w),
  [ResourceType.Vinho]: p(wi),
  [ResourceType.Marmore]: p(m),
  [ResourceType.Cristal]: p(c),
  [ResourceType.Enxofre]: p(s),
});

// --- Cost Factory Helpers ---

// Wood, Marble (Most common)
const costWM = (l: number, w: any, m: any): BuildingCost => ({ level: l, resources: r(w, 0, m, 0, 0) });
// Wood, Crystal (Academy, Workshop)
const costWC = (l: number, w: any, c: any): BuildingCost => ({ level: l, resources: r(w, 0, 0, c, 0) });
// All 5 (Palace, Gov Res)
const costAll = (l: number, w: any, wi: any, m: any, c: any, s: any): BuildingCost => ({ level: l, resources: r(w, wi, m, c, s) });


// --- Data Definitions ---

const townHallCosts: BuildingCost[] = [
  // Existing levels 1-12
  costWM(1, 73, 0), costWM(2, 126, 0), costWM(3, 199, 0), costWM(4, 299, 9),
  costWM(5, 435, 36), costWM(6, 620, 85), costWM(7, 872, 168), costWM(8, 1215, 303),
  costWM(9, 1682, 515), costWM(10, 2317, 839), costWM(11, 3181, 1326), costWM(12, 4356, 2049),
  // New Data 13-62
  costWM(13, '5.953', '3.112'), costWM(14, '8.137', '6.343'), costWM(15, '10.404', '8.533'),
  costWM(16, '13.241', '11.417'), costWM(17, '16.783', '15.209'), costWM(18, '21.195', '20.181'),
  costWM(19, '26.681', '26.688'), costWM(20, '33.491', '35.187'), costWM(21, '41.933', '46.270'),
  costWM(22, '52.379', '60.696'), costWM(23, '65.291', '79.450'), costWM(24, '81.230', '103.795'),
  costWM(25, '100.881', '135.357'), costWM(26, '125.084', '176.227'), costWM(27, '154.862', '229.090'),
  costWM(28, '191.463', '297.397'), costWM(29, '236.410', '385.570'), costWM(30, '291.560', '499.283'),
  costWM(31, '359.173', '645.810'), costWM(32, '442.004', '834.461'), costWM(33, '543.403', '1,08M'),
  costWM(34, '667.448', '1,39M'), costWM(35, '819.098', '1,79M'), costWM(36, '1,00M', '2,30M'),
  costWM(37, '1,23M', '2,96M'), costWM(38, '1,51M', '3,81M'), costWM(39, '1,84M', '4,90M'),
  costWM(40, '2,25M', '6,29M'), costWM(41, '2,75M', '8,06M'), costWM(42, '3,36M', '10,34M'),
  costWM(43, '4,11M', '13,25M'), costWM(44, '5,01M', '16,97M'), costWM(45, '6,11M', '21,73M'),
  costWM(46, '7,44M', '27,80M'), costWM(47, '9,06M', '35,56M'), costWM(48, '11,03M', '45,45M'),
  costWM(49, '13,43M', '58,08M'), costWM(50, '16,34M', '74,18M'), costWM(51, '19,86M', '94,71M'),
  costWM(52, '24,14M', '120,88M'), costWM(53, '29,34M', '154,21M'), costWM(54, '35,63M', '196,67M'),
  costWM(55, '43,27M', '250,73M'), costWM(56, '52,52M', '319,55M'), costWM(57, '63,72M', '407,12M'),
  costWM(58, '77,30M', '518,54M'), costWM(59, '93,74M', '660,25M'), costWM(60, '113,65M', '840,44M'),
  costWM(61, '137,74M', '1,07G'), costWM(62, '166,90M', '1,36G')
];

const academyCosts: BuildingCost[] = [
  // Existing 1-10
  costWC(1, 64, 0), costWC(2, 108, 0), costWC(3, 173, 0), costWC(4, 265, 12),
  costWC(5, 395, 39), costWC(6, 578, 87), costWC(7, 835, 169), costWC(8, 1196, 303),
  costWC(9, 1702, 521), costWC(10, 2413, 869),
  // New 11-60
  costWC(11, '1.207', '1.711'), costWC(12, '1.755', '2.532'), costWC(13, '2.537', '3.740'),
  costWC(14, '3.651', '5.514'), costWC(15, '5.232', '8.109'), costWC(16, '7.469', '11.890'),
  costWC(17, '10.624', '17.383'), costWC(18, '15.065', '25.348'), costWC(19, '21.302', '36.865'),
  costWC(20, '30.040', '53.484'), costWC(21, '42.260', '77.421'), costWC(22, '59.320', '111.831'),
  costWC(23, '83.100', '161.219'), costWC(24, '116.197', '231.996'), costWC(25, '162.196', '333.284'),
  costWC(26, '226.047', '478.040'), costWC(27, '314.572', '684.674'), costWC(28, '437.166', '979.294'),
  costWC(29, '606.769', '1,40M'), costWC(30, '841.171', '2,00M'), costWC(31, '1,16M', '2,84M'),
  costWC(32, '1,61M', '4,05M'), costWC(33, '2,23M', '5,76M'), costWC(34, '3,07M', '8,19M'),
  costWC(35, '4,24M', '11,62M'), costWC(36, '5,85M', '16,49M'), costWC(37, '8,05M', '23,38M'),
  costWC(38, '11,08M', '33,11M'), costWC(39, '15,24M', '46,88M'), costWC(40, '20,95M', '66,31M'),
  costWC(41, '28,78M', '93,75M'), costWC(42, '39,51M', '132,46M'), costWC(43, '54,21M', '187,05M'),
  costWC(44, '74,34M', '264,00M'), costWC(45, '101,88M', '372,40M'), costWC(46, '139,57M', '525,06M'),
  costWC(47, '191,11M', '739,94M'), costWC(48, '261,55M', '1,04G'), costWC(49, '357,82M', '1,47G'),
  costWC(50, '489,30M', '2,07G'), costWC(51, '668,83M', '2,91G'), costWC(52, '913,89M', '4,09G'),
  costWC(53, '1,25G', '5,74G'), costWC(54, '1,70G', '8,07G'), costWC(55, '2,33G', '11,34G'),
  costWC(56, '3,17G', '15,93G'), costWC(57, '4,33G', '22,36G'), costWC(58, '5,90G', '31,38G'),
  costWC(59, '8,05G', '44,03G'), costWC(60, '10,97G', '61,76G')
];

const warehouseCosts: BuildingCost[] = [
  // Existing 1-5
  costWM(1, 128, 0), costWM(2, 244, 0), costWM(3, 390, 0), costWM(4, 575, 10), costWM(5, 807, 39),
  // Gap 6-9 not provided, proceeding with 10+
  costWM(10, '1.089', '608'), costWM(11, '1.392', '794'), costWM(12, '1.772', '1.028'),
  costWM(13, '2.249', '1.318'), costWM(14, '2.841', '1.680'), costWM(15, '3.578', '2.128'),
  costWM(16, '4.493', '2.681'), costWM(17, '5.624', '3.365'), costWM(18, '7.020', '4.207'),
  costWM(19, '8.742', '5.242'), costWM(20, '10.860', '6.513'), costWM(21, '13.463', '8.070'),
  costWM(22, '16.657', '9.976'), costWM(23, '20.571', '12.305'), costWM(24, '25.361', '15.148'),
  costWM(25, '31.216', '18.615'), costWM(26, '38.366', '22.837'), costWM(27, '47.088', '27.976'),
  costWM(28, '57.717', '34.221'), costWM(29, '70.660', '41.807'), costWM(30, '86.407', '51.013'),
  costWM(31, '105.549', '62.175'), costWM(32, '128.800', '75.701'), costWM(33, '157.027', '92.078'),
  costWM(34, '191.265', '111.894'), costWM(35, '232.771', '135.856'), costWM(36, '283.057', '164.814'),
  costWM(37, '343.945', '199.789'), costWM(38, '417.629', '242.008'), costWM(39, '506.750', '292.946'),
  costWM(40, '614.490', '354.371'), costWM(41, '744.673', '428.406'), costWM(42, '901.904', '517.600'),
  costWM(43, '1,09M', '625.009'), costWM(44, '1,32M', '754.297'), costWM(45, '1,60M', '909.859'),
  costWM(46, '1,93M', '1,10M'), costWM(47, '2,33M', '1,32M'), costWM(48, '2,82M', '1,59M'),
  costWM(49, '3,40M', '1,92M'), costWM(50, '4,10M', '2,31M'), costWM(51, '4,94M', '2,78M'),
  costWM(52, '5,96M', '3,34M'), costWM(53, '7,18M', '4,01M'), costWM(54, '8,65M', '4,82M'),
  costWM(55, '10,42M', '5,79M'), costWM(56, '12,54M', '6,96M'), costWM(57, '15,09M', '8,35M'),
  costWM(58, '18,16M', '10,02M'), costWM(59, '21,84M', '12,02M')
];

const tavernCosts: BuildingCost[] = [
  costWM(10, '1.287', '139'), costWM(11, '1.658', '184'), costWM(12, '2.120', '245'),
  costWM(13, '2.694', '328'), costWM(14, '3.404', '442'), costWM(15, '4.282', '596'),
  costWM(16, '5.364', '806'), costWM(17, '6.696', '1.089'), costWM(18, '8.331', '1.471'),
  costWM(19, '10.335', '1.985'), costWM(20, '12.786', '2.676'), costWM(21, '15.783', '3.603'),
  costWM(22, '19.438', '4.843'), costWM(23, '23.891', '6.501'), costWM(24, '29.311', '8.714'),
  costWM(25, '35.899', '11.664'), costWM(26, '43.899', '15.592'), costWM(27, '53.603', '20.815'),
  costWM(28, '65.365', '27.755'), costWM(29, '79.607', '36.964'), costWM(30, '96.838', '49.174'),
  costWM(31, '117.669', '65.347'), costWM(32, '142.833', '86.754'), costWM(33, '173.211', '115.064'),
  costWM(34, '209.858', '152.476'), costWM(35, '254.041', '201.881'), costWM(36, '307.275', '267.078'),
  costWM(37, '371.378', '353.064'), costWM(38, '448.529', '466.393'), costWM(39, '541.332', '615.677'),
  costWM(40, '652.909', '812.212'), costWM(41, '786.992', '1,07M'), costWM(42, '948.048', '1,41M'),
  costWM(43, '1,14M', '1,86M'), costWM(44, '1,37M', '2,45M'), costWM(45, '1,65M', '3,22M'),
  costWM(46, '1,99M', '4,23M'), costWM(47, '2,39M', '5,56M'), costWM(48, '2,87M', '7,30M'),
  costWM(49, '3,44M', '9,59M'), costWM(50, '4,13M', '12,58M'), costWM(51, '4,95M', '16,51M'),
  costWM(52, '5,94M', '21,65M'), costWM(53, '7,12M', '28,39M'), costWM(54, '8,53M', '37,20M'),
  costWM(55, '10,21M', '48,74M'), costWM(56, '12,23M', '63,83M'), costWM(57, '14,64M', '83,57M'),
  costWM(58, '17,51M', '109,37M'), costWM(59, '20,95M', '143,11M')
];

const palaceCosts: BuildingCost[] = [
  costAll(1, '534', 0, 0, 0, 0),
  costAll(2, '4.358', 0, '1.050', 0, 0),
  costAll(3, '12.833', 0, '2.359', 0, '2.574'),
  costAll(4, '30.646', '8.394', '5.444', 0, '6.471'),
  costAll(5, '66.807', '15.557', '12.431', '17.231', '15.246'),
  costAll(6, '138.420', '31.184', '27.840', '31.745', '34.487'),
  costAll(7, '277.660', '64.604', '61.147', '62.831', '75.842'),
  costAll(8, '544.554', '135.001', '132.049', '128.406', '163.381'),
  costAll(9, '1,05M', '281.513', '281.163', '265.078', '346.465'),
  costAll(10, '2,00M', '583.470', '591.708', '547.158', '725.639'),
  costAll(11, '3,77M', '1,20M', '1,23M', '1,12M', '1,50M'),
  costAll(12, '7,04M', '2,45M', '2,55M', '2,30M', '3,09M'),
  costAll(13, '13,07M', '4,98M', '5,23M', '4,67M', '6,32M'),
  costAll(14, '24,12M', '10,07M', '10,68M', '9,45M', '12,83M'),
  costAll(15, '44,26M', '20,23M', '21,69M', '19,01M', '25,90M'),
  costAll(16, '80,87M', '40,48M', '43,85M', '38,09M', '52,08M'),
  costAll(17, '147,18M', '80,69M', '88,30M', '76,03M', '104,30M'),
  costAll(18, '266,95M', '160,28M', '177,20M', '151,22M', '208,17M'),
  costAll(19, '482,66M', '317,38M', '354,49M', '299,86M', '414,20M'),
  costAll(20, '870,28M', '626,73M', '707,21M', '592,97M', '821,84M'),
  costAll(21, '1,57G', '1,23G', '1,41G', '1,17G', '1,63G'),
  costAll(22, '2,81G', '2,43G', '2,79G', '2,30G', '3,21G'),
  costAll(23, '5,03G', '4,76G', '5,54G', '4,52G', '6,33G'),
  costAll(24, '8,99G', '9,32G', '10,95G', '8,86G', '12,45G'),
  costAll(25, '16,04G', '18,20G', '21,62G', '17,34G', '24,45G'),
  costAll(26, '28,58G', '35,52G', '42,61G', '33,89G', '47,92G'),
  costAll(27, '50,83G', '69,19G', '83,86G', '66,11G', '93,81G'),
  costAll(28, '90,30G', '134,61G', '164,82G', '128,79G', '183,38G'),
  costAll(29, '160,20G', '261,54G', '323,53G', '250,59G', '358,00G'),
  costAll(30, '283,87G', '507,56G', '634,31G', '486,99G', '698,09G')
];

const governorCosts: BuildingCost[] = [
  costAll(5, '63.512', '15.891', '14.187', '18.013', '14.733'),
  costAll(6, '132.135', '30.703', '31.673', '31.617', '33.218'),
  costAll(7, '266.068', '62.525', '69.062', '60.917', '73.085'),
  costAll(8, '523.751', '129.863', '147.809', '123.063', '157.764'),
  costAll(9, '1,01M', '270.639', '311.675', '253.290', '335.461'),
  costAll(10, '1,94M', '562.079', '649.350', '523.522', '704.713'),
  costAll(11, '3,67M', '1,16M', '1,34M', '1,08M', '1,47M'),
  costAll(12, '6,87M', '2,38M', '2,74M', '2,22M', '3,02M'),
  costAll(13, '12,80M', '4,86M', '5,57M', '4,53M', '6,20M'),
  costAll(14, '23,70M', '9,85M', '11,25M', '9,20M', '12,62M'),
  costAll(15, '43,66M', '19,88M', '22,61M', '18,61M', '25,56M'),
  costAll(16, '80,06M', '39,96M', '45,24M', '37,49M', '51,57M'),
  costAll(17, '146,24M', '79,99M', '90,15M', '75,21M', '103,62M'),
  costAll(18, '266,18M', '159,58M', '179,05M', '150,39M', '207,49M'),
  costAll(19, '483,02M', '317,39M', '354,51M', '299,80M', '414,20M'),
  costAll(20, '874,06M', '629,51M', '699,97M', '595,98M', '824,55M'),
  costAll(21, '1,58G', '1,25G', '1,38G', '1,18G', '1,64G'),
  costAll(22, '2,84G', '2,46G', '2,71G', '2,34G', '3,24G'),
  costAll(23, '5,11G', '4,84G', '5,31G', '4,62G', '6,41G'),
  costAll(24, '9,16G', '9,52G', '10,40G', '9,10G', '12,66G'),
  costAll(25, '16,40G', '18,69G', '20,32G', '17,90G', '24,93G'),
  costAll(26, '29,33G', '36,62G', '39,63G', '35,15G', '49,04G'),
  costAll(27, '52,36G', '71,66G', '77,20G', '68,94G', '96,31G'),
  costAll(28, '93,34G', '140,03G', '150,17G', '135,03G', '188,87G'),
  costAll(29, '166,20G', '273,28G', '291,74G', '264,11G', '369,95G'),
  costAll(30, '295,56G', '532,69G', '566,09G', '516,00G', '723,75G')
];

const museumCosts: BuildingCost[] = [
  costWM(1, '382', '187'), costWM(2, '664', '448'), costWM(3, '1.169', '923'),
  costWM(4, '2.037', '1.756'), costWM(5, '3.494', '3.183'), costWM(6, '5.892', '5.573'),
  costWM(7, '9.779', '9.519'), costWM(8, '16.008', '15.956'), costWM(9, '25.894', '26.352'),
  costWM(10, '41.460', '43.008'), costWM(11, '65.806', '69.511'), costWM(12, '103.667', '111.439'),
  costWM(13, '162.256', '177.436'), costWM(14, '252.530', '280.866'), costWM(15, '391.098', '442.335'),
  costWM(16, '603.079', '693.556'), costWM(17, '926.393', '1,08M'), costWM(18, '1,42M', '1,69M'),
  costWM(19, '2,16M', '2,62M'), costWM(20, '3,29M', '4,05M'), costWM(21, '5,00M', '6,25M'),
  costWM(22, '7,58M', '9,62M'), costWM(23, '11,45M', '14,79M'), costWM(24, '17,28M', '22,68M'),
  costWM(25, '26,02M', '34,73M'), costWM(26, '39,14M', '53,10M'), costWM(27, '58,76M', '81,06M'),
  costWM(28, '88,12M', '123,57M'), costWM(29, '131,96M', '188,14M'), costWM(30, '197,39M', '286,11M'),
  costWM(31, '294,92M', '434,60M'), costWM(32, '440,19M', '659,48M'), costWM(33, '656,38M', '999,74M'),
  costWM(34, '977,85M', '1,51G'), costWM(35, '1,46G', '2,29G'), costWM(36, '2,16G', '3,46G'),
  costWM(37, '3,22G', '5,23G'), costWM(38, '4,78G', '7,90G'), costWM(39, '7,09G', '11,92G'),
  costWM(40, '10,51G', '17,98G'), costWM(41, '15,58G', '27,08G'), costWM(42, '23,08G', '40,79G'),
  costWM(43, '34,17G', '61,38G'), costWM(44, '50,55G', '92,33G'), costWM(45, '74,76G', '138,81G'),
  costWM(46, '110,50G', '208,59G'), costWM(47, '163,25G', '313,29G'), costWM(48, '241,07G', '470,34G'),
  costWM(49, '355,83G', '705,81G'), costWM(50, '525,01G', '1,06T') // 1,06T handled as G * 1000 roughly or just ignore T suffix and use number. p() handles M/G/k. 1,06T is huge. Let's assume user knows limits or manual correction. 1.06T = 1,060G.
].map(c => {
  // Hotfix for T suffix if parsed as 0 or small
  // Since our parser handles M/G, T is not there.
  // 1,06T = 1060G = 1,060,000,000,000. 
  // Javascript MAX_SAFE_INTEGER is 9Peta. 1 Tera is fine.
  // I'll manually fix level 50 in code above or let user handle it. 
  // Actually, I'll just use G for the last one to be safe: 1060G
  if (c.level === 50 && c.resources.Madeira === 0) { 
     // Re-parse manually if needed, but for now lets assume G was used or manual number.
     // In the array above I wrote '1,06T'. My parser returns 1 (ignores T).
     // Let's change it to '1.060G' in the array for safety.
     // Updating array entry in place:
     // costWM(50, '525,01G', '1.060G')
  }
  return c;
});

// Fix for Museum 50 in array definition directly
museumCosts[museumCosts.length-1] = costWM(50, '525,01G', '1.060G');


const tradingPortCosts: BuildingCost[] = [
  costWM(10, '1.563', '765'), costWM(11, '2.047', '1.036'), costWM(12, '2.657', '1.394'),
  costWM(13, '3.425', '1.861'), costWM(14, '4.388', '2.470'), costWM(15, '5.594', '3.262'),
  costWM(16, '7.099', '4.288'), costWM(17, '8.975', '5.616'), costWM(18, '11.306', '7.328'),
  costWM(19, '14.199', '9.533'), costWM(20, '17.783', '12.368'), costWM(21, '22.216', '16.005'),
  costWM(22, '27.691', '20.665'), costWM(23, '34.445', '26.626'), costWM(24, '42.764', '34.243'),
  costWM(25, '52.999', '43.961'), costWM(26, '65.580', '56.347'), costWM(27, '81.027', '72.116'),
  costWM(28, '99.975', '92.172'), costWM(29, '123.197', '117.655'), costWM(30, '151.632', '150.004'),
  costWM(31, '186.422', '191.035'), costWM(32, '228.956', '243.036'), costWM(33, '280.921', '308.891'),
  costWM(34, '344.363', '392.230'), costWM(35, '421.768', '497.621'), costWM(36, '516.149', '630.817'),
  costWM(37, '631.163', '799.047'), costWM(38, '771.243', '1,01M'), costWM(39, '941.758', '1,28M'),
  costWM(40, '1,15M', '1,62M'), costWM(41, '1,40M', '2,04M'), costWM(42, '1,71M', '2,58M'),
  costWM(43, '2,08M', '3,25M'), costWM(44, '2,53M', '4,10M'), costWM(45, '3,08M', '5,17M'),
  costWM(46, '3,75M', '6,52M'), costWM(47, '4,56M', '8,21M'), costWM(48, '5,54M', '10,33M'),
  costWM(49, '6,73M', '13,00M'), costWM(50, '8,17M', '16,34M'), costWM(51, '9,91M', '20,55M'),
  costWM(52, '12,02M', '25,82M'), costWM(53, '14,58M', '32,43M'), costWM(54, '17,67M', '40,72M'),
  costWM(55, '21,41M', '51,12M'), costWM(56, '25,94M', '64,15M'), costWM(57, '31,42M', '80,47M'),
  costWM(58, '38,03M', '100,92M'), costWM(59, '46,03M', '126,52M')
];

const shipyardCosts: BuildingCost[] = [
  costWM(3, 163, 0), costWM(4, 237, 0), costWM(5, 339, 0),
  costWM(6, 475, 624), costWM(7, 657, 789), costWM(8, 900, '1.011'), costWM(9, '1.219', '1.301'),
  costWM(10, '1.639', '1.683'), costWM(11, '2.186', '2.180'), costWM(12, '2.899', '2.827'),
  costWM(13, '3.822', '3.664'), costWM(14, '5.014', '4.743'), costWM(15, '6.549', '6.132'),
  costWM(16, '8.520', '7.914'), costWM(17, '11.047', '10.194'), costWM(18, '14.276', '13.107'),
  costWM(19, '18.397', '16.821'), costWM(20, '23.646', '21.546'), costWM(21, '30.320', '27.550'),
  costWM(22, '38.793', '35.165'), costWM(23, '49.536', '44.809'), costWM(24, '63.138', '57.008'),
  costWM(25, '80.339', '72.421'), costWM(26, '102.065', '91.870'), costWM(27, '129.478', '116.386'),
  costWM(28, '164.032', '147.261'), costWM(29, '207.546', '186.106'), costWM(30, '262.295', '234.932'),
  costWM(31, '331.121', '296.255'), costWM(32, '417.575', '373.213'), costWM(33, '526.090', '469.719'),
  costWM(34, '662.200', '590.652'), costWM(35, '832.806', '742.093'), costWM(36, '1,05M', '931.618'),
  costWM(37, '1,31M', '1,17M'), costWM(38, '1,65M', '1,46M'), costWM(39, '2,07M', '1,84M'),
  costWM(40, '2,59M', '2,30M'), costWM(41, '3,24M', '2,87M'), costWM(42, '4,06M', '3,59M'),
  costWM(43, '5,08M', '4,49M'), costWM(44, '6,35M', '5,61M'), costWM(45, '7,93M', '7,00M'),
  costWM(46, '9,91M', '8,74M'), costWM(47, '12,37M', '10,90M'), costWM(48, '15,43M', '13,58M'),
  costWM(49, '19,24M', '16,92M'), costWM(50, '23,99M', '21,08M'), costWM(51, '29,89M', '26,24M'),
  costWM(52, '37,24M', '32,66M')
];

const barracksCosts: BuildingCost[] = [
  costWM(1, 31, 0), costWM(2, 52, 0), costWM(3, 83, 0), costWM(4, 126, 0),
  costWM(5, 182, 0), costWM(6, 258, 0), costWM(7, 358, 0), costWM(8, 489, 0),
  costWM(9, 660, 114), costWM(10, 883, 275), costWM(11, '1.170', 482), costWM(12, '1.539', 749),
  costWM(13, '2.013', '1.090'), costWM(14, '2.619', '1.526'), costWM(15, '3.391', '2.080'),
  costWM(16, '4.372', '2.784'), costWM(17, '5.617', '3.676'), costWM(18, '7.191', '4.803'),
  costWM(19, '9.181', '6.225'), costWM(20, '11.689', '8.016'), costWM(21, '14.847', '10.268'),
  costWM(22, '18.817', '13.095'), costWM(23, '23.799', '16.640'), costWM(24, '30.044', '21.079'),
  costWM(25, '37.864', '26.629'), costWM(26, '47.643', '33.562'), costWM(27, '59.861', '42.215'),
  costWM(28, '75.110', '53.001'), costWM(29, '94.124', '66.435'), costWM(30, '117.813', '83.152'),
  costWM(31, '147.300', '103.937'), costWM(32, '183.977', '129.760'), costWM(33, '229.562', '161.819'),
  costWM(34, '286.181', '201.592'), costWM(35, '356.456', '250.901'), costWM(36, '443.628', '311.993'),
  costWM(37, '551.691', '387.642'), costWM(38, '685.577', '481.260'), costWM(39, '851.366', '597.053'),
  costWM(40, '1,06M', '740.199'), costWM(41, '1,31M', '917.070'), costWM(42, '1,62M', '1,14M'),
  costWM(43, '2,01M', '1,41M'), costWM(44, '2,49M', '1,74M'), costWM(45, '3,08M', '2,15M'),
  costWM(46, '3,81M', '2,65M'), costWM(47, '4,71M', '3,28M'), costWM(48, '5,83M', '4,05M'),
  costWM(49, '7,20M', '4,99M'), costWM(50, '8,88M', '6,16M')
];

const wallCosts: BuildingCost[] = [
  costWM(1, 93, 0), costWM(2, 193, 183), costWM(3, 323, 322), costWM(4, 495, 501),
  costWM(5, 714, 733), costWM(6, 993, '1.028'), costWM(7, '1.348', '1.403'), costWM(8, '1.796', '1.874'),
  costWM(9, '2.356', '2.465'), costWM(10, '3.055', '3.203'), costWM(11, '3.923', '4.119'),
  costWM(12, '4.998', '5.255'), costWM(13, '6.325', '6.656'), costWM(14, '7.959', '8.381'),
  costWM(15, '9.966', '10.499'), costWM(16, '12.424', '13.094'), costWM(17, '15.428', '16.266'),
  costWM(18, '19.093', '20.138'), costWM(19, '23.558', '24.854'), costWM(20, '28.987', '30.589'),
  costWM(21, '35.580', '37.554'), costWM(22, '43.574', '46.000'), costWM(23, '53.255', '56.229'),
  costWM(24, '64.964', '68.603'), costWM(25, '79.111', '83.555'), costWM(26, '96.185', '101.602'),
  costWM(27, '116.773', '123.364'), costWM(28, '141.574', '149.583'), costWM(29, '171.424', '181.143'),
  costWM(30, '207.322', '219.100'), costWM(31, '250.460', '264.716'), costWM(32, '302.259', '319.496'),
  costWM(33, '364.416', '385.236'), costWM(34, '438.952', '464.077'), costWM(35, '528.277', '558.569'),
  costWM(36, '635.261', '671.752'), costWM(37, '763.321', '807.246'), costWM(38, '916.529', '969.360'),
  costWM(39, '1,10M', '1,16M'), costWM(40, '1,32M', '1,39M'), costWM(41, '1,58M', '1,67M'),
  costWM(42, '1,89M', '2,00M'), costWM(43, '2,27M', '2,40M'), costWM(44, '2,71M', '2,87M'),
  costWM(45, '3,24M', '3,43M'), costWM(46, '3,87M', '4,10M'), costWM(47, '4,63M', '4,90M'),
  costWM(48, '5,52M', '5,85M'), costWM(49, '6,59M', '6,98M'), costWM(50, '7,86M', '8,33M')
];

const embassyCosts: BuildingCost[] = [
  costWM(1, 156, 101), costWM(2, 192, 144), costWM(3, 241, 204), costWM(4, 305, 284),
  costWM(5, 390, 392), costWM(6, 501, 535), costWM(7, 642, 722), costWM(8, 823, 965),
  costWM(9, '1.054', '1.280'), costWM(10, '1.346', '1.685'), costWM(11, '1.715', '2.204'),
  costWM(12, '2.178', '2.866'), costWM(13, '2.758', '3.710'), costWM(14, '3.483', '4.779'),
  costWM(15, '4.385', '6.132'), costWM(16, '5.507', '7.838'), costWM(17, '6.898', '9.985'),
  costWM(18, '8.619', '12.682'), costWM(19, '10.744', '16.064'), costWM(20, '13.365', '20.296'),
  costWM(21, '16.592', '25.583'), costWM(22, '20.559', '32.179'), costWM(23, '25.430', '40.398'),
  costWM(24, '31.404', '50.623'), costWM(25, '38.720', '63.332'), costWM(26, '47.671', '79.109'),
  costWM(27, '58.612', '98.674'), costWM(28, '71.972', '122.914'), costWM(29, '88.271', '152.917'),
  costWM(30, '108.141', '190.022'), costWM(31, '132.342', '235.873'), costWM(32, '161.797', '292.486'),
  costWM(33, '197.621', '362.337'), costWM(34, '241.163', '448.461'), costWM(35, '294.049', '554.580'),
  costWM(36, '358.247', '685.255'), costWM(37, '436.130', '846.071'), costWM(38, '530.564', '1,04M'),
  costWM(39, '645.004', '1,29M'), costWM(40, '783.619', '1,59M'), costWM(41, '951.434', '1,95M'),
  costWM(42, '1,15M', '2,40M'), costWM(43, '1,40M', '2,96M'), costWM(44, '1,70M', '3,63M'),
  costWM(45, '2,06M', '4,46M'), costWM(46, '2,49M', '5,48M'), costWM(47, '3,01M', '6,73M'),
  costWM(48, '3,65M', '8,25M'), costWM(49, '4,41M', '10,12M'), costWM(50, '5,33M', '12,41M')
];

const marketCosts: BuildingCost[] = [
  costWM(1, 54, 0), costWM(2, 131, 0), costWM(3, 239, 0), costWM(4, 386, 0),
  costWM(5, 586, 425), costWM(6, 852, 580), costWM(7, '1.207', 785), costWM(8, '1.672', '1.055'),
  costWM(9, '2.282', '1.410'), costWM(10, '3.074', '1.871'), costWM(11, '4.100', '2.468'),
  costWM(12, '5.424', '3.240'), costWM(13, '7.126', '4.231'), costWM(14, '9.305', '5.503'),
  costWM(15, '12.090', '7.129'), costWM(16, '15.638', '9.202'), costWM(17, '20.148', '11.839'),
  costWM(18, '25.870', '15.186'), costWM(19, '33.113', '19.427'), costWM(20, '42.266', '24.789'),
  costWM(21, '53.815', '31.559'), costWM(22, '68.365', '40.094'), costWM(23, '86.669', '50.839'),
  costWM(24, '109.665', '64.348'), costWM(25, '138.524', '81.310'), costWM(26, '174.694', '102.586'),
  costWM(27, '219.985', '129.244'), costWM(28, '276.638', '162.611'), costWM(29, '347.436', '204.338'),
  costWM(30, '435.834', '256.472'), costWM(31, '546.116', '321.556'), costWM(32, '683.592', '402.741'),
  costWM(33, '854.838', '503.939'), costWM(34, '1,07M', '629.989'), costWM(35, '1,33M', '786.892'),
  costWM(36, '1,66M', '982.077'), costWM(37, '2,07M', '1,22M'), costWM(38, '2,58M', '1,53M'),
  costWM(39, '3,21M', '1,90M'), costWM(40, '3,99M', '2,37M'), costWM(41, '4,97M', '2,94M'),
  costWM(42, '6,17M', '3,66M'), costWM(43, '7,66M', '4,54M'), costWM(44, '9,50M', '5,64M'),
  costWM(45, '11,78M', '7,00M'), costWM(46, '14,61M', '8,68M'), costWM(47, '18,10M', '10,76M'),
  costWM(48, '22,41M', '13,34M'), costWM(49, '27,74M', '16,52M'), costWM(50, '34,33M', '20,46M')
];

const workshopCosts: BuildingCost[] = [
  costWC(10, '1.957', '1.024'), costWC(11, '2.373', '1.256'), costWC(12, '2.859', '1.530'),
  costWC(13, '3.423', '1.852'), costWC(14, '4.077', '2.227'), costWC(15, '4.836', '2.668'),
  costWC(16, '5.713', '3.181'), costWC(17, '6.726', '3.779'), costWC(18, '7.893', '4.475'),
  costWC(19, '9.236', '5.282'), costWC(20, '10.781', '6.219'), costWC(21, '12.555', '7.304'),
  costWC(22, '14.590', '8.560'), costWC(23, '16.921', '10.012'), costWC(24, '19.591', '11.688'),
  costWC(25, '22.643', '13.622'), costWC(26, '26.131', '15.851'), costWC(27, '30.115', '18.418'),
  costWC(28, '34.659', '21.371'), costWC(29, '39.840', '24.767'), costWC(30, '45.743', '28.669'),
  costWC(31, '52.463', '33.150'), costWC(32, '60.111', '38.291'), costWC(33, '68.807', '44.186'),
  costWC(34, '78.691', '50.943'), costWC(35, '89.917', '58.683'), costWC(36, '102.664', '67.544'),
  costWC(37, '117.129', '77.685'), costWC(38, '133.535', '89.281'), costWC(39, '152.136', '102.539'),
  costWC(40, '173.214', '117.688'), costWC(41, '197.092', '134.992'), costWC(42, '224.130', '154.747'),
  costWC(43, '254.733', '177.293'), costWC(44, '289.360', '203.016'), costWC(45, '328.525', '232.351'),
  costWC(46, '372.809', '265.792'), costWC(47, '422.863', '303.904'), costWC(48, '479.422', '347.325'),
  costWC(49, '543.312', '396.776'), costWC(50, '615.460', '453.081'), costWC(51, '696.911', '517.168'),
  costWC(52, '788.840', '590.094'), costWC(53, '892.567', '673.054'), costWC(54, '1,01M', '767.406'),
  costWC(55, '1,14M', '874.683'), costWC(56, '1,29M', '996.628'), costWC(57, '1,46M', '1,14M'),
  costWC(58, '1,65M', '1,29M'), costWC(59, '1,86M', '1,47M')
];

const espionageCosts: BuildingCost[] = [
  costWM(1, 68, 0), costWM(2, 127, 0), costWM(3, 200, 0), costWM(4, 287, 75),
  costWM(5, 393, 106), costWM(6, 520, 144), costWM(7, 672, 193), costWM(8, 851, 250),
  costWM(9, '1.065', 320), costWM(10, '1.316', 404), costWM(11, '1.612', 507),
  costWM(12, '1.959', 628), costWM(13, '2.365', 774), costWM(14, '2.840', 949),
  costWM(15, '3.394', '1.156'), costWM(16, '4.039', '1.402'), costWM(17, '4.788', '1.694'),
  costWM(18, '5.656', '2.041'), costWM(19, '6.663', '2.449'), costWM(20, '7.829', '2.933'),
  costWM(21, '9.174', '3.503'), costWM(22, '10.729', '4.174'), costWM(23, '12.522', '4.962'),
  costWM(24, '14.586', '5.889'), costWM(25, '16.963', '6.977'), costWM(26, '19.695', '8.253'),
  costWM(27, '22.835', '9.748'), costWM(28, '26.438', '11.497'), costWM(29, '30.572', '13.544'),
  costWM(30, '35.312', '15.936'), costWM(31, '40.741', '18.728'), costWM(32, '46.956', '21.988'),
  costWM(33, '54.067', '25.790'), costWM(34, '62.199', '30.220'), costWM(35, '71.491', '35.382'),
  costWM(36, '82.106', '41.392'), costWM(37, '94.224', '48.384'), costWM(38, '108.053', '56.517'),
  costWM(39, '123.825', '65.971'), costWM(40, '141.807', '76.957'), costWM(41, '162.299', '89.715'),
  costWM(42, '185.642', '104.526'), costWM(43, '212.224', '121.713'), costWM(44, '242.480', '141.650'),
  costWM(45, '276.906', '164.767'), costWM(46, '316.065', '191.562'), costWM(47, '360.593', '222.609'),
  costWM(48, '411.206', '258.571'), costWM(49, '468.722', '300.212'), costWM(50, '534.058', '348.414')
];

export const BUILDINGS_DB: Building[] = [
  { id: 'town_hall', name: 'Câmara Municipal', costs: townHallCosts },
  { id: 'academy', name: 'Academia', costs: academyCosts },
  { id: 'warehouse', name: 'Armazém', costs: warehouseCosts },
  { id: 'tavern', name: 'Taberna', costs: tavernCosts },
  { id: 'palace', name: 'Palácio', costs: palaceCosts },
  { id: 'governor_residence', name: 'Residência do Governador', costs: governorCosts },
  { id: 'museum', name: 'Museu', costs: museumCosts },
  { id: 'trading_port', name: 'Porto Mercantil', costs: tradingPortCosts },
  { id: 'shipyard', name: 'Estaleiro', costs: shipyardCosts },
  { id: 'barracks', name: 'Quartel', costs: barracksCosts },
  { id: 'town_wall', name: 'Muralha da Cidade', costs: wallCosts },
  { id: 'embassy', name: 'Embaixada', costs: embassyCosts },
  { id: 'market', name: 'Mercado', costs: marketCosts },
  { id: 'workshop', name: 'Oficina', costs: workshopCosts },
  { id: 'hideout', name: 'Espionagem', costs: espionageCosts }
].sort((a, b) => a.name.localeCompare(b.name));

export const getBuildingById = (id: string) => BUILDINGS_DB.find(b => b.id === id);
