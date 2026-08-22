// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title ReceiptsRegistry
/// @notice Write-once Merkle roots under a strictly increasing sequence number (one batch every ~5 minutes).
///         Leaves are built off-chain with OpenZeppelin StandardMerkleTree, so proofs verify with MerkleProof.
/// @dev    The owner (cold) can only rotate the committer. Roots can never be changed or deleted. The contract
///         assigns batch ids itself, so a leaked committer key can add junk batches but can never block,
///         overwrite or reorder an honest one.
contract ReceiptsRegistry is Ownable2Step {
    struct Batch { bytes32 root; uint32 leafCount; uint64 committedAt; address committer; }

    address public committer;
    uint64 public lastBatchId;                            // sequence number of the newest batch; the first is 1
    mapping(uint64 => Batch) private _batches;

    event CommitterChanged(address indexed previous, address indexed next);
    event BatchCommitted(uint64 indexed batchId, bytes32 indexed root, uint32 leafCount, address indexed committer);

    error NotCommitter();
    error EmptyBatch();

    constructor(address owner_, address committer_) Ownable(owner_) {
        committer = committer_;
        emit CommitterChanged(address(0), committer_);
    }

    /// @return batchId the sequence number assigned to this batch (also emitted in BatchCommitted).
    function commit(bytes32 root, uint32 leafCount) external returns (uint64 batchId) {
        if (msg.sender != committer) revert NotCommitter();
        if (root == bytes32(0) || leafCount == 0) revert EmptyBatch();
        batchId = ++lastBatchId;                          // never overwrites, never goes backwards, never skips
        _batches[batchId] = Batch(root, leafCount, uint64(block.timestamp), msg.sender);
        emit BatchCommitted(batchId, root, leafCount, msg.sender);
    }

    function setCommitter(address next) external onlyOwner {
        emit CommitterChanged(committer, next);
        committer = next;
    }

    function batch(uint64 batchId) external view returns (Batch memory) {
        return _batches[batchId];
    }

    /// @notice Anyone can check a leaf against a committed root.
    function verify(uint64 batchId, bytes32 leaf, bytes32[] calldata proof) external view returns (bool) {
        bytes32 root = _batches[batchId].root;
        return root != bytes32(0) && MerkleProof.verifyCalldata(proof, root, leaf);
    }
}
