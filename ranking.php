<!-- PHP -->
<?php
//var_dump($_POST);
//
// idの引継ぎ状況を確認
if(isset($_POST['id'])) {
	// idを引き継いでいる場合 => データを更新
	$id = $_POST['id'];
	//
	$newEntryIs = false; // 新規挿入か否か
}
else {
	// idの引継ぎが無い場合 => データを新規挿入
	// 現在の時間(ms)を16進数変換したものをidとしてみよう。
	date_default_timezone_set('Japan');
	$now = time();
	$id = base_convert($now, 10, 16);
	//
	$newEntryIs = true; // 新規挿入か否か
}
//
function dbConection() { // mySQL DBへの接続
	// 現在の接続を確認
	$nowConection = $_SERVER['SERVER_NAME'];
	//
	$HOST = 'localhost';//
	$dbNAME = 'saicoropuzzle'; // データベース名
	if( $nowConection == 'cf670622.cloudfree.jp' ) {
		$dbNAME = 'cf670622_'.$dbNAME; // データベース名
	}
	$USER = 'cf670622_nicky'; // ユーザ名
	$PASS = 'nicky1976'; // パスワード
	//
	$pdo = new PDO("mysql:host=$HOST; dbname=$dbNAME; charset=utf8", $USER , $PASS); // DBへの接続
	return $pdo;
}
function getRawRanking( $table , $order ) { // ランキング情報を全て取得(登録順)
	$pdo = dbConection(); // データベースへの接続
	if($order === 'score') {
		$sql = $pdo->prepare("SELECT * FROM $table ORDER BY score DESC"); // 全データ取得　降順
	}
	else {
		$sql = $pdo->prepare("SELECT * FROM $table ORDER BY time "); // 全データ取得　照準
	}
	$sql->execute();
	$allRanking = $sql->fetchAll(); // 取得データを変数に置き換え
	unset($pdo); // データベースからの切断
	//
	return $allRanking;
}
function insertRanking($table, $info) { // ランキングへ挿入
	//
	$pdo = dbConection(); // データベースへの接続
	$sql = $pdo->prepare("INSERT INTO $table VALUES(?, ?, ?, ?, NOW())"); // 全データ取得
	$sql->execute([
		htmlspecialchars($info['id']),
		htmlspecialchars($info['name']),
		htmlspecialchars($info['time']),
		htmlspecialchars($info['score']),
	]);
	unset($pdo); // データベースからの切断

}
function updateRanking($table, $info) { // ランキングを更新
	//
	$pdo = dbConection(); // データベースへの接続
	$sql = $pdo->prepare("UPDATE $table SET name=? WHERE id=?"); // 全データ取得
	$sql->execute([
		htmlspecialchars($info['name']),
		htmlspecialchars($info['id']),
	]);
	unset($pdo); // データベースからの切断
}
//
// $_POSTデータをチェック
if( isset($_POST['gMode']) ) {
	// ゲームモードが設定されているなら...
	// 名称
	$name = $_POST['name'] ?? 'noNAME';
	if( $name == '' ) { $name = 'noNAME'; }
	// タイム
	$time = $_POST['time'];
	// スコア
	$score = $_POST['score'];
	// ゲームモード <= これがテーブル
	$gMode = $_POST['gMode'];
	// 優先記録
	$record = $_POST['record'];
	// 書き込みフラグ
	$wrFlg = $_POST['wrFlg'];
	//
	// idの引継ぎ状況を確認
	if($wrFlg === 'true') {
		if($newEntryIs) {
			// ランキングdbに挿入
			insertRanking($gMode, [
				'id' => $id,
				'name' => $name,
				'time' => $time,
				'score' => $score,
				'record' => $record,
			]);
			//
		}
		else {
			// ランキングdbを更新
			updateRanking($gMode, [
				'id' => $id,
				'name' => $name,
				'time' => $time,
				'score' => $score,
				'record' => $record,
			]);
			//
		}
	}
}
//
// ランキングの全データ取得
if( isset($gMode) ) {
	$allRankingDATA = getRawRanking($gMode, $record); 
}
else { 
	$allRankingDATA[0] = [
		'id' => '123',
		'name' => '456',
		'time' => '789',
		'score' => '0',
	];
}
// 順位確認
$yourRank = 0;
for($i=0; $i<count($allRankingDATA); $i++) {
	if($id == $allRankingDATA[$i]['id']) { 
		$yourRank = $i + 1;
		break;
	}
}

?>
<!-- HTML -->
<!DOCTYPE html>
<html lang="ja">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="./style/reset.css">
		<title>RANKING</title>
		<style>
			@charset "utf-8";
			body {
				overflow: hidden;
			}
			.tableWrap {
				height: 264px;
				overflow: hidden;
				overflow-y: scroll;
				scroll-behavior: smooth;

				position: relative;
			}
			table {
				font-family: monospace;
				width: calc(100% - 20px);
				margin: 0 auto;
				text-align: right;
				padding: 0px;
				background: #fff;

				border-collapse: separate;
				border-spacing: 1px; 

				position: relative;
			}
			thead {
				position: -webkit-sticky;
				position: sticky;
				top: 0px;
			}
			th { 
				vertical-align: middle;
				text-align: right;
				background: #fcc;
				padding: 2px 5px;
			}
			thead th {
				background: #ccf;
			}
			tbody>tr:nth-of-type(2n) {
				background: #eee;
			}
			tbody>tr:nth-of-type(2n)>th {
				background: #faa;
			}
			td {
				vertical-align: middle;
				padding: 2px 5px;
			}
			.nowInsert {
				outline: 4px solid #ff3;

				animation: outlineAnime 1s ease-in-out infinite
			}
			@keyframes outlineAnime {
				0% { outline-offset: 0px; }
				50% { outline-offset: 3px; }
				100% { outline-offset: 0px; }
			}
			.nameEntryInput {
				text-align: right;
			}
			#nameEntrySubmit {
				padding: 1px 3px 0px 6px;
				background: #f99;
				border: 2px solid #f99;
				border-radius: 3px;

				color: #fff;
				font-weight: bold;
			}
			#nameEntrySubmit:focus,
			#nameEntrySubmit:hover {
				background: #fff;
				border-color: #f66;
				color: #f66;
			}
		</style>
	</head>
	<body>
		<!-- pre><?php /*渡せていることの確認*/ var_dump($_REQUEST); ?></pre -->
		<?php 
		if($yourRank != 0) {
			echo '<p> '.$yourRank.' 位に入りました。</p>';
		}
		?>
		<div class="tableWrap">
		<table>
			<caption>
				<?php if( isset($gMode) ) { echo $gMode; } ?>
			</caption>
			<thead>
				<th></th>
				<th>NAME</th>
				<th>Time</th>
				<th>Score</th>
				<th></th>
			</thead>
			<tbody>
				<?php foreach($allRankingDATA as $i=>$row) { ?>
				<tr <?php 
						if($row['id'] == $id) { echo 'class="nowInsert"'; }
						if($i+1 == $yourRank-2) { echo 'id="scrollPoint"'; }
					?>>
					<th>No.<?php echo $i+1; ?></th>
					<td><?php 
							if($row['id'] == $id && $newEntryIs) { 
								print <<< _FORM_
								<form id="nameEntry" acction="./test.php" method="POST">
									<input type="text" class="nameEntryInput" size="7" maxlength="6" name="name" placeholder="noName" autofocus=true>
									<input type="hidden" name="id" value="$id">
									<input type="hidden" name="time" value="$time">
									<input type="hidden" name="score" value="$score">
									<input type="hidden" name="gMode" value="$gMode">
									<input type="hidden" name="record" value="$record">
									<input type="hidden" name="wrFlg" value="$wrFlg">
								<form>
								_FORM_;
							}
							else { echo $row['name']; }
						?></td>
					<td><?php echo $row['time']; ?></td>
					<td><?php echo $row['score']; ?></td>
					<td><?php 
							if($row['id'] == $id && $newEntryIs) {
								echo '<input type="submit" form="nameEntry" id="nameEntrySubmit" value="ENTRY">';
							}
						?></td>
				</tr>
				<?php } ?>
			</tbody>
		</table>
		</div>
	</body>
	<script>
		var testVal = <?php 
			print $allRankingDATA[0]['score'];
		?>;
	</script>
</html>
