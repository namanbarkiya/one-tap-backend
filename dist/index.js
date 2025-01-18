"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const hpp_1 = __importDefault(require("hpp"));
const envVariables_1 = require("./utils/envVariables");
const userRouter_1 = require("./User/Router/userRouter");
const leaderBoardRouter_1 = require("./LeaderBoard/Routers/leaderBoardRouter");
const gamesRouter_1 = require("./Games/Routes/gamesRouter");
const inventoryRouter_1 = require("./Inventory/Router/inventoryRouter");
const challengesRouter_1 = require("./challenges/Routers/challengesRouter");
const martkitPlacerouter_1 = require("./MarkitPlace/Router/martkitPlacerouter");
const OverWolfToNativeIdMapper_1 = require("./utils/Middleware/OverWolfToNativeIdMapper");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use((0, hpp_1.default)());
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json("Hi");
}));
app.use("/user", userRouter_1.userRouter);
app.use("/game", gamesRouter_1.gamesRouter);
app.use("/inventory", inventoryRouter_1.inventoryRouter);
app.use("/marketplace", martkitPlacerouter_1.markitPlaceRouter);
app.use(OverWolfToNativeIdMapper_1.OverWolfIdToNativeMapper);
app.use("/leaderboard", leaderBoardRouter_1.leaderBoardRouter);
app.use("/challenges", challengesRouter_1.challengesRouter);
app.use("*", (req, res) => {
    res.status(404).json("No Such Route");
});
const port = envVariables_1.envVariables.PORT;
app.listen(port, () => {
    console.log(`Backend Running on http://localhost:${port}`);
});
