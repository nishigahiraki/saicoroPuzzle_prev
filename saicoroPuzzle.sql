

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- データベース: `gametest`
--

-- --------------------------------------------------------

--
-- テーブルの構造
--

CREATE TABLE `TimeTrial2min` (
  `id` varchar(20) NOT NULL,
  `name` varchar(6) NOT NULL,
  `time` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE `Servival` (
  `id` varchar(20) NOT NULL,
  `name` varchar(6) NOT NULL,
  `time` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE `dice10Challenge` (
  `id` varchar(20) NOT NULL,
  `name` varchar(6) NOT NULL,
  `time` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
--
-- テーブルのインデックス `slidepuzzle`
--
ALTER TABLE `TimeTrial2min`
  ADD PRIMARY KEY (`id`);
COMMIT;

ALTER TABLE `Servival`
  ADD PRIMARY KEY (`id`);
COMMIT;

ALTER TABLE `dice10Challenge`
  ADD PRIMARY KEY (`id`);
COMMIT;
