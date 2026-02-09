import blockService from "#services/block.service.js";

class BlockController {
    async getAllBlock(req, res) {
        const user = req.user;
        if (!user) return res.unauthorized();

        try {
            const result = await blockService.getAllBlock(user.id);
            return res.success(result);
        } catch (err) {
            console.log(err);
            return res.error(err);
        }
    }
}

export default new BlockController();
