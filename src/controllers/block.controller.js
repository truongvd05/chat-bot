import blockService from "#services/block.service.js";

class BlockController {
    async getAllBlock(req, res) {
        const user = req.user;
        if (!user) return res.unauthorized();

        const result = await blockService.getAllBlock(user.id);
        return res.success(result);
    }
}

export default new BlockController();
