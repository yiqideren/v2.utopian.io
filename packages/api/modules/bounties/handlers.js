const Boom = require('boom')
const Franc = require('franc')
const { slugify } = require('../../utils/slugify')
const { extractText, sanitizeHtml } = require('../../utils/html-sanitizer')

const Bounty = require('./bounty.model')
const Category = require('../categories/category.model')
const Proposal = require('./proposal.model')
const User = require('../users/user.model')
const Vote = require('../votes/vote.model')

const SBDUSD = 0.98281782 // TODO dynamic service

/**
 * Creates the bounty
 *
 * @payload {object} req.payload - bounty data
 *
 * @returns updated data needed to publish to the blockchain
 * @author Grégory LATINIER
 */
const createBounty = async (req, h) => {
  const author = req.auth.credentials.uid
  const username = req.auth.credentials.username
  const { amount, body, ...bounty } = req.payload
  let slug = `${username}/${slugify(bounty.title)}`
  if (await Bounty.countDocuments({ $or: [{ slugs: { $elemMatch: { $eq: slug } } }, { slug }], author }) > 0) {
    slug += `-${Date.now()}`
  }

  const lang = Franc(extractText(body), {})

  const newBounty = new Bounty({
    ...bounty,
    amount: [{ amount, currency: 'sbd' }], // This will later allow multiple currencies bounty load
    author,
    body: sanitizeHtml(body),
    lang,
    slug
  })

  // Does the category exists and is it available?
  const category = await Category.countDocuments({ key: req.payload.category, active: true })
  if (category === 0) {
    throw Boom.badData('general.categoryNotAvailable')
  }

  const response = await newBounty.save()

  return h.response({
    _id: response._id,
    body: response.body,
    category: response.category,
    skills: response.skills,
    slug: response.slug,
    title: response.title
  })
}

/**
 * Updates the bounty's data
 *
 * @param {object} req - request
 * @param {object} req.params - request parameters
 * @param {string} req.params.id -  bounty ObjectID as route element
 * @payload {object} req.payload - bounty data
 *
 * @returns updated slug
 * @author Grégory LATINIER
 */
const updateBounty = async (req, h) => {
  const author = req.auth.credentials.uid
  const username = req.auth.credentials.username
  const bountyDb = await Bounty.findOne({ author, _id: req.params.id })
  if (!bountyDb) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  // Was the title updated? If yes we need to archive the previous slug
  let slug = `${username}/${slugify(req.payload.title)}`
  const slugs = bountyDb.slugs || []
  if (bountyDb.slug !== slug) {
    if (!bountyDb.slugs.includes(slug) && await Bounty.countDocuments({ $or: [{ slugs: { $elemMatch: { $eq: slug } } }, { slug }], author }) > 0) {
      slug += `-${Date.now()}`
    }

    if (!bountyDb.slugs.includes(bountyDb.slug)) {
      slugs.push(bountyDb.slug)
    }
  }

  const lang = Franc(extractText(req.payload.body), {})

  // Does the category exists and is it available?
  const category = await Category.countDocuments({ key: req.payload.category, active: true })
  if (category === 0) {
    throw Boom.badData('general.categoryNotAvailable')
  }

  const { amount, body, ...bounty } = req.payload
  const response = await Bounty.findOneAndUpdate(
    { author, _id: req.params.id },
    {
      ...bounty,
      body: sanitizeHtml(body),
      lang,
      slug,
      slugs,
      amount: [{ amount, currency: 'sbd' }], // This will later allow multiple currencies bounty load
      updatedAt: Date.now()
    },
    { new: true }
  )

  if (response) {
    return h.response({
      _id: response._id,
      body: response.body,
      category: response.category,
      skills: response.skills,
      slug: response.slug,
      title: response.title
    })
  }

  throw Boom.badData('general.updateFail')
}

/**
 * Returns a bounty by its author and slug for edit purposes
 *
 * @param {object} req - request
 * @param {object} req.params - request parameters
 * @param {string} req.params.author - bounty author's username as route element
 * @param {string} req.params.slug - bounty title as route element
 *
 * @returns bounty
 * @author Grégory LATINIER
 */
const getBountyForEdit = async (req, h) => {
  const userId = req.auth.credentials.uid
  const slug = `${req.params.author}/${req.params.slug}`
  const bounty = await Bounty.findOne({ $or: [{ slugs: { $elemMatch: { $eq: slug } } }, { slug }] })
    .populate('assignee', 'username avatarUrl')
    .populate('project', 'name')
    .select('amount author assignees body category deadline issue project status title skills blockchains')
  if (!bounty) return h.response({})
  if (bounty.author.toString() === userId) {
    return h.response(bounty)
  }

  throw Boom.unauthorized('general.unauthorized')
}

/**
 * Returns a bounty by its author and slug
 *
 * @param {object} req - request
 * @param {object} req.params - request parameters
 * @param {string} req.params.author - bounty author's username as route element
 * @param {string} req.params.slug - bounty title as route element
 *
 * @returns bounty
 * @author Grégory LATINIER
 */
const getBounty = async (req, h) => {
  const slug = `${req.params.author}/${req.params.slug}`

  // TODO view count todo => https://redditblog.com/2017/05/24/view-counting-at-reddit/
  const bounty = await Bounty.findOne({ $or: [{ slugs: { $elemMatch: { $eq: slug } } }, { slug }], deletedAt: null })
    .populate('author', 'username avatarUrl job reputation')
    .populate('assignee', 'username avatarUrl')
    .populate('activity.user', 'username avatarUrl')
    .populate('project', 'avatarUrl name slug')
    .select('amount activity author assignees body category deadline issue project skills status title upVotes')
    .lean()
  if (!bounty) return h.response(null)

  const user = req.auth.credentials && req.auth.credentials.uid
  if (user) {
    const vote = await Vote.findOne({
      objRef: 'bounties',
      objId: bounty._id,
      user
    })
    if (vote) {
      bounty.userVote = vote.dir
    }

    const proposal = await Proposal.countDocuments({ author: user, bounty: bounty._id })
    if (proposal > 0) {
      bounty.userProposal = true
    }
  }

  bounty.quotes = {
    SBDUSD
  }

  return h.response(bounty)
}

/**
 * Updates the bounty's blockchain data
 *
 * @param {object} req - request
 * @param {object} req.params - request parameters
 * @param {string} req.params.id -  bounty ObjectID as route element
 * @param {string} req.params.blockchain -  article blockchain as route element
 * @payload {object} req.payload - blockchain data
 *
 * @returns blockchain data
 * @author Grégory LATINIER
 */
const updateBlockchainData = async (req, h) => {
  const author = req.auth.credentials.uid
  const bounty = await Bounty.findOne({ author, _id: req.params.id })
  if (!bounty) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  let result
  if (bounty.blockchains.some((b) => b.name === req.params.blockchain)) {
    result = await Bounty.findOneAndUpdate(
      { author, _id: req.params.id, 'blockchains.name': req.params.blockchain },
      {
        $set: {
          'blockchains.$': {
            name: req.params.blockchain,
            data: req.payload,
            updatedAt: Date.now()
          }
        }
      },
      { new: true }
    )
  } else {
    const newBlockchain = bounty.blockchains.create({
      name: req.params.blockchain,
      data: req.payload,
      updatedAt: Date.now()
    })
    bounty.blockchains.push(newBlockchain)
    result = await bounty.save()
  }

  return h.response(result.blockchains)
}

/**
 * Creates the proposal
 *
 * @payload {object} req.payload - proposal data
 *
 * @returns {object} - new proposal
 * @author Grégory LATINIER
 */
const createProposal = async (req, h) => {
  const author = req.auth.credentials.uid
  const { body, bounty } = req.payload
  const proposalDb = await Proposal.countDocuments({ author, bounty })
  if (proposalDb > 0) {
    throw Boom.badData('bounty.proposal.exists')
  }

  const bountyDb = await Bounty.findOne({ _id: bounty }).select('activity status')
  if (!bountyDb) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  if (bountyDb.status !== 'open') {
    throw Boom.badData('bounty.notAvailable')
  }

  const newProposal = new Proposal({
    author,
    body: sanitizeHtml(body),
    bounty
  })

  await newProposal.save()
  const proposal = await Proposal.populate(newProposal, [{ path: 'author', select: 'username avatarUrl' }])
  let activity
  if (!bountyDb.activity.some((a) => a.user.toString() === author && a.key === 'proposal')) {
    activity = {
      user: author,
      color: 'primary',
      icon: 'mdi-file-document',
      key: 'proposal',
      data: {},
      createdAt: Date.now()
    }
    bountyDb.activity.push(bountyDb.activity.create(activity))
    await bountyDb.save()
    activity.user = proposal.author
  }

  return h.response({
    proposal,
    activity
  })
}

/**
 * Updates a proposal
 *
 * @payload {object} req.payload - proposal data
 *
 * @returns {object} - updated proposal
 * @author Grégory LATINIER
 */
const updateProposal = async (req, h) => {
  const author = req.auth.credentials.uid
  const proposalDb = await Proposal.findOne({ author, _id: req.params.id })
  if (!proposalDb) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  const bountyDb = await Bounty.findOne({ _id: proposalDb.bounty }).select('assignee')
  if (bountyDb.assignee) {
    throw Boom.badData('bounty.notAvailable')
  }

  const response = await Proposal.findOneAndUpdate(
    { author, _id: req.params.id },
    {
      body: sanitizeHtml(req.payload.body),
      updatedAt: Date.now()
    },
    { new: true }
  )

  if (response) {
    return h.response(await Proposal.populate(response, [{ path: 'author', select: 'username avatarUrl' }]))
  }

  throw Boom.badData('general.updateFail')
}

/**
 * Deletes a proposal
 *
 * @returns bool
 * @author Grégory LATINIER
 */
const deleteProposal = async (req, h) => {
  const author = req.auth.credentials.uid
  const proposalDb = await Proposal.findOne({ author, _id: req.params.id })
  if (!proposalDb) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  const bountyDb = await Bounty.findOne({ _id: proposalDb.bounty }).select('assignee')
  if (bountyDb.assignee) {
    throw Boom.badData('bounty.notAvailable')
  }

  const response = await Proposal.deleteOne({ author, _id: req.params.id })

  if (response.n === 1) {
    return h.response(true)
  }

  throw Boom.badData('general.deleteFail')
}

/**
 * Returns an array of proposals of a given bounty
 *
 * @param {object} req - request
 * @param {object} req.params - request parameters
 * @param {string} req.params.author - bounty author
 * @param {string} req.params.slug - bounty slug
 *
 * @returns comments
 * @author Grégory LATINIER
 */
const getProposals = async (req, h) => {
  const { limit, skip } = req.query
  let total = -1
  if (skip === 0) {
    total = await Proposal.countDocuments({ bounty: req.params.id })
  }

  const proposals = await Proposal.find({ bounty: req.params.id })
    .limit(limit)
    .skip(skip)
    .populate('author', 'username avatarUrl')
    .select('author body createdAt')
    .sort({ createdAt: 'asc' })

  return h.response({
    proposals: proposals || [],
    total
  })
}

/**
 * Returns options for the autocomplete based on the user input
 *
 * @param {object} req - request
 * @param {object} h - response
 * @payload {object} req.payload.partial - contains the term to be searched
 *
 * @returns contains the matched skills
 * @author Adriel Santos
 */

const searchSkills = async (req, h) => {
  const skills = await Bounty.aggregate([
    { '$unwind': '$skills' },
    { '$match': { skills: { '$regex': `^${req.payload.partial}`, '$options': 'i', '$nin': req.payload.skills } } },
    { '$group': { _id: '$skills', occurrences: { '$sum': 1 } } },
    { '$limit': 10 },
    { '$addFields': { name: '$_id' } },
    { '$sort': { 'occurrences': -1, 'name': 1 } }
  ])

  return h.response(skills)
}

/**
 * Return the steem username of the sender and recipient of the escrow
 *
 * @param {object} req - request
 * @payload {object} req.payload.id - user id who made the proposal
 * @param {object} h - response
 *
 * @author Grégory LATINIER
 */
const escrowAccounts = async (req, h) => {
  const senderId = req.auth.credentials.uid
  const receiverId = req.payload.id

  const senderDb = await User.findOne({ _id: senderId }).select('blockchainAccounts')
  const senderAccount = senderDb.blockchainAccounts.find((a) => a.blockchain === 'steem')
  const sender = senderAccount && senderAccount.address
  const receiverDb = await User.findOne({ _id: receiverId }).select('blockchainAccounts')
  const receiverAccount = receiverDb.blockchainAccounts.find((a) => a.blockchain === 'steem')
  const receiver = receiverAccount && receiverAccount.address

  return h.response({
    sender,
    receiver
  })
}

/**
 *
 * @param {object} req - request
 * @param {object} h - response
 *
 * @author Grégory LATINIER
 */
const assignUser = async (req, h) => {
  const author = req.auth.credentials.uid
  const { id, escrowId, from, to, agent, assignee, transaction } = req.payload

  const bounty = await Bounty.findOne({ _id: id, author })
  if (!bounty) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  const block = await req.steem.api.getBlockAsync(transaction.block)
  if (!block) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  const blockchainTransaction = block.transactions.find((t) => t.transaction_id === transaction.id)
  if (!blockchainTransaction) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  const operation = blockchainTransaction.operations[0][1]
  if (
    operation.from !== from ||
    operation.to !== to ||
    operation.agent !== agent ||
    operation.escrow_id !== parseInt(escrowId) ||
    parseFloat(operation.sbd_amount).toFixed(3) !== parseFloat(bounty.amount[0].amount).toFixed(3) ||
    parseFloat(operation.fee).toFixed(3) !== (parseFloat(bounty.amount[0].amount) * 5 / 100).toFixed(3)
  ) {
    throw Boom.badData('general.documentDoesNotExist')
  }

  const assignedUser = await User.findOne({ _id: assignee }).select('username avatarUrl')
  const activity = {
    user: author,
    color: 'primary',
    icon: 'mdi-clipboard-account',
    key: 'assign',
    data: {
      assignee: assignedUser.username
    },
    createdAt: Date.now()
  }

  bounty.activity.push(bounty.activity.create(activity))
  const response = await Bounty.findOneAndUpdate(
    { _id: id, author },
    {
      activity: bounty.activity,
      assignee,
      status: 'inProgress',
      escrow: { escrowId, from, to, agent }
    },
    { new: true }
  )

  if (response) {
    activity.user = await User.findOne({ _id: author }).select('username avatarUrl')
    return h.response({
      activity,
      assignee: assignedUser,
      status: 'inProgress'
    })
  }
}

module.exports = {
  createBounty,
  updateBounty,
  getBountyForEdit,
  getBounty,
  updateBlockchainData,
  createProposal,
  updateProposal,
  deleteProposal,
  getProposals,
  searchSkills,
  escrowAccounts,
  assignUser
}
